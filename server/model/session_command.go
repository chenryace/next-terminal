package model

import "next-terminal/server/common"

type SessionCommand struct {
	ID        string          `gorm:"primary_key,type:varchar(36)" json:"id"`
	SessionId string          `json:"sessionId"`
	RiskLevel int             `json:"riskLevel"` // 风险等级 1：高危 3：普通
	Command   string          `json:"command"`   // 内容
	Result    string          `json:"result"`
	Created   common.JsonTime `json:"created"`
}

func (m SessionCommand) TableName() string {
	return "session_commands"
}
