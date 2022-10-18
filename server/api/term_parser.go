package api

import (
	"bytes"
	"context"
	"fmt"
	"next-terminal/server/service"
	"regexp"
	"strings"
	"sync"
	"time"

	"next-terminal/server/common"
	"next-terminal/server/log"
	"next-terminal/server/model"
	"next-terminal/server/repository"
	"next-terminal/server/utils"

	"github.com/dushixiang/vt-go"
)

var (
	charEnter = []byte("\r")
	clean     = []byte{'\x05', '\x15', '\r'}

	enterMarks = [][]byte{
		[]byte("\x1b[?1049h"),
		[]byte("\x1b[?1048h"),
		[]byte("\x1b[?1047h"),
		[]byte("\x1b[?47h"),
	}

	exitMarks = [][]byte{
		[]byte("\x1b[?1049l"),
		[]byte("\x1b[?1048l"),
		[]byte("\x1b[?1047l"),
		[]byte("\x1b[?47l"),
	}
)

type CommandFilterRule struct {
	Re      *regexp.Regexp // 正则
	Command string         // 命令
	Rule    string         // 允许或拒绝
}

func NewTermParser(userId, assetId, sessionId string) *TermParser {

	ctx, cancel := context.WithCancel(context.Background())

	commandFilterRules, _ := getCommandFilterRules(userId, assetId)

	return &TermParser{
		sessionId:          sessionId,
		ctx:                ctx,
		cancel:             cancel,
		inputState:         false,
		vimState:           false,
		commandFilterRules: commandFilterRules,
		cmdInputParser:     vt.New(),
		cmdOutputParser:    vt.New(),
		commandChan:        make(chan *model.SessionCommand, 1024),
	}
}

type TermParser struct {
	sessionId          string
	ctx                context.Context
	cancel             context.CancelFunc
	commandFilterRules []*CommandFilterRule // 命令过滤器规则
	ps1                string               // Linux PS1 例如 [root@VM-24-14-centos ~]# ，用于去除命令返回值中多余的部分
	ps1Once            sync.Once            // ps1 初始化
	inputState         bool                 // 是否正在输入
	inputStateRWMutex  sync.RWMutex         // 输入锁
	vimState           bool                 // 是否处于vim模式
	cmdInputParser     vt.VirtualTerminal   // 解析执行的命令
	cmdOutputParser    vt.VirtualTerminal   // 解析执行命令的输出

	lastInputCommand     string                     // 最后一个命令
	lastInputCommandTime time.Time                  // 最后一个命令输入的时间
	commandChan          chan *model.SessionCommand // 用户异步保存输入的命令和结果
}

func getCommandFilterRules(userId, assetId string) (commandFilterRules []*CommandFilterRule, err error) {

	authorised, err := service.AuthorisedService.GetAuthorised(userId, assetId)
	if err != nil {
		return nil, err
	}
	if authorised == nil || authorised.ID == "" {
		return nil, nil
	}

	commandFilterId := authorised.CommandFilterId
	commandFilter, err := repository.CommandFilterRepository.FindById(context.Background(), commandFilterId)
	if err != nil {
		return nil, err
	}

	rules, err := repository.CommandFilterRuleRepository.FindByCommandFilterIdSortByPriorityDesc(context.Background(), commandFilter.ID)
	if err != nil {
		return nil, err
	}

	for _, rule := range rules {
		if rule.Enabled != nil && *(rule.Enabled) == false {
			continue
		}
		if rule.Type == "regexp" {
			compile, err := regexp.Compile(rule.Content)
			if err != nil {
				log.Errorf("编译黑名单命令失败: %s", err.Error())
				continue
			}
			commandFilterRules = append(commandFilterRules, &CommandFilterRule{
				Re:      compile,
				Command: "",
				Rule:    rule.Rule,
			})
		} else {
			commandFilterRules = append(commandFilterRules, &CommandFilterRule{
				Re:      nil,
				Command: rule.Content,
				Rule:    rule.Rule,
			})
		}
	}

	return commandFilterRules, nil
}

func (r *TermParser) SetInputState(state bool) {
	r.inputStateRWMutex.Lock()
	defer r.inputStateRWMutex.Unlock()
	r.inputState = state
}

func (r *TermParser) GetInputState() bool {
	r.inputStateRWMutex.RLock()
	defer r.inputStateRWMutex.RUnlock()
	return r.inputState
}

func (r *TermParser) StartCommandRecorder() {
	for {
		select {
		case <-r.ctx.Done():
			return
		case sessionCommand := <-r.commandChan:
			_ = repository.SessionCommandRepository.Create(context.Background(), sessionCommand)
		}
	}
}

func (r *TermParser) StopCommandRecorder() {
	r.sendCommandAndResult()
	r.cancel()
}

func (r *TermParser) Write(p []byte) {
	r.parseVimState(p)
	if !r.vimState {
		if r.GetInputState() {
			_, _ = r.cmdInputParser.Advance(p)
		} else {
			_, _ = r.cmdOutputParser.Advance(p)
		}
	}
}

func (r *TermParser) MatchForbiddenCommand(input []byte) (bool, string, []byte) {
	if bytes.LastIndex(input, charEnter) == 0 {
		r.sendCommandAndResult()
		r.SetInputState(false)
		inputCommand := r.parseInputCommand()
		var pass = r.matchForbiddenCommand(inputCommand)
		if !pass {
			frontendMsg := r.handleForbiddenCommand(inputCommand)
			return true, frontendMsg, clean
		}
		r.lastInputCommand = inputCommand
		r.lastInputCommandTime = time.Now()
	} else {
		r.SetInputState(true)
	}
	return false, "", nil
}

func (r *TermParser) handleForbiddenCommand(inputCommand string) (frontendMsg string) {
	var message = "您输入的命令已被禁止执行。"
	frontendMsg = fmt.Sprintf(`[1;31m%s[0m`, "\r\n"+message+"\r\n")
	// 命令已被阻断，不需要再解析返回的结果
	r.lastInputCommand = ""

	sessionCommand := &model.SessionCommand{
		ID:        utils.UUID(),
		SessionId: r.sessionId,
		RiskLevel: 1,
		Command:   inputCommand,
		Result:    message,
		Created:   common.NowJsonTime(),
	}

	r.commandChan <- sessionCommand

	return frontendMsg
}

func (r *TermParser) matchForbiddenCommand(inputCommand string) bool {
	if inputCommand == "" {
		return true
	}
	var pass = true
	for _, rule := range r.commandFilterRules {
		var match = false
		if rule.Re != nil {
			match = rule.Re.MatchString(inputCommand)
		} else {
			match = rule.Command == inputCommand
		}
		if !match {
			continue
		}
		pass = rule.Rule == "allow"
	}
	return pass
}

func (r *TermParser) parseInputCommand() string {
	r.cmdInputParser.Parse()
	commands := r.cmdInputParser.Result()
	defer r.cmdInputParser.Reset()
	var inputCommand = ""
	if len(commands) == 0 {
		inputCommand = ""
	} else {
		inputCommand = commands[len(commands)-1]
		if r.ps1 != "" {
			inputCommand = strings.ReplaceAll(inputCommand, r.ps1, "")
		}
	}
	return inputCommand
}

func (r *TermParser) parseOutputResult() string {
	r.cmdOutputParser.Parse()
	results := r.cmdOutputParser.Result()
	defer r.cmdOutputParser.Reset()

	var outputs []string
	var noWord = true
	for _, result := range results {
		if r.ps1 != "" {
			result = strings.ReplaceAll(result, r.ps1, "")
		}
		if noWord {
			noWord = result == ""
		}
		if noWord && result == "" {
			continue
		}
		outputs = append(outputs, result)
	}
	length := len(outputs)
	if length == 0 {
		return ""
	} else if length == 1 {
		return outputs[0]
	}
	return strings.Join(outputs[:length-1], "\r\n")
}

func (r *TermParser) lastOutputResult() string {
	r.cmdOutputParser.Parse()
	results := r.cmdOutputParser.Result()
	defer r.cmdOutputParser.Reset()
	length := len(results)
	if length > 0 {
		return results[length-1]
	}
	return ""
}

func (r *TermParser) sendCommandAndResult() {
	if r.lastInputCommand != "" {
		inputCommand := r.lastInputCommand
		outputResult := r.parseOutputResult()

		sessionCommand := &model.SessionCommand{
			ID:        utils.UUID(),
			SessionId: r.sessionId,
			RiskLevel: 3,
			Command:   inputCommand,
			Result:    outputResult,
			Created:   common.NewJsonTime(r.lastInputCommandTime),
		}

		r.commandChan <- sessionCommand

		r.lastInputCommand = ""
	} else {
		// 初始化PS1
		r.ps1Once.Do(func() {
			r.ps1 = r.lastOutputResult()
		})
	}
}

func (r *TermParser) parseVimState(b []byte) {
	if !r.vimState && IsEditEnterMode(b) {
		r.vimState = true
	}
	if r.vimState && IsEditExitMode(b) {
		r.vimState = false
	}
}

func IsEditEnterMode(p []byte) bool {
	return matchMark(p, enterMarks)
}

func IsEditExitMode(p []byte) bool {
	return matchMark(p, exitMarks)
}

func matchMark(p []byte, marks [][]byte) bool {
	for _, item := range marks {
		if bytes.Contains(p, item) {
			return true
		}
	}
	return false
}
