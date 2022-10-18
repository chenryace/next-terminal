package model

import "next-terminal/server/common"

type CommandFilter struct {
	ID      string          `gorm:"primary_key,type:varchar(36)" json:"id"`
	Name    string          `gorm:"type:varchar(200)" json:"name"` // 名称
	Created common.JsonTime `json:"created"`
}

func (m CommandFilter) TableName() string {
	return "command_filters"
}

type CommandFilterRule struct {
	ID              string `gorm:"primary_key,type:varchar(36)" json:"id"`
	CommandFilterId string `gorm:"index,type:varchar(36)" json:"commandFilterId"`
	Type            string `gorm:"type:varchar(10)" json:"type"` // 正则表达式(regexp)或命令(command)
	Content         string `json:"content"`                      // 内容
	Priority        int64  `json:"priority"`                     // 优先级 越小优先级越高
	Enabled         *bool  `json:"enabled"`                      // 是否激活
	Rule            string `gorm:"type:varchar(20)" json:"rule"` // 规则 允许或拒绝
}

func (c CommandFilterRule) TableName() string {
	return "command_filter_rules"
}
