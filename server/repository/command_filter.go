package repository

import (
	"context"

	"next-terminal/server/model"
)

type commandFilterRepository struct {
	baseRepository
}

func (r commandFilterRepository) Find(c context.Context, pageIndex, pageSize int, name, order, field string) (o []model.CommandFilter, total int64, err error) {
	db := r.GetDB(c).Table("command_filters")
	dbCounter := r.GetDB(c).Table("command_filters")

	if len(name) > 0 {
		db = db.Where("command_filters.name like ?", "%"+name+"%")
		dbCounter = dbCounter.Where("command_filters.name like ?", "%"+name+"%")
	}

	err = dbCounter.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if order == "" {
		order = "asc"
	} else if order == "ascend" {
		order = "asc"
	} else {
		order = "desc"
	}

	if field == "name" {
		field = "command_filters.name"
	} else {
		field = "command_filters.created"
	}

	err = db.Order(field + " " + order).Find(&o).Offset((pageIndex - 1) * pageSize).Limit(pageSize).Error
	if o == nil {
		o = make([]model.CommandFilter, 0)
	}
	return
}

func (r commandFilterRepository) DeleteById(c context.Context, id string) error {
	return r.GetDB(c).Where("id = ?", id).Delete(model.CommandFilter{}).Error
}

func (r commandFilterRepository) Create(c context.Context, m *model.CommandFilter) error {
	return r.GetDB(c).Create(m).Error
}

func (r commandFilterRepository) UpdateById(c context.Context, o *model.CommandFilter, id string) error {
	o.ID = id
	return r.GetDB(c).Updates(o).Error
}

func (r commandFilterRepository) FindById(c context.Context, id string) (m model.CommandFilter, err error) {
	err = r.GetDB(c).Where("id = ?", id).First(&m).Error
	return
}

func (r commandFilterRepository) FindAll(c context.Context) (items []model.CommandFilter, err error) {
	err = r.GetDB(c).Order("name asc").Find(&items).Error
	return
}

type commandFilterRuleRepository struct {
	baseRepository
}

func (r commandFilterRuleRepository) Find(c context.Context, pageIndex, pageSize int, commandFilterId, _type, content, order, field string) (o []model.CommandFilterRule, total int64, err error) {
	db := r.GetDB(c).Table("command_filter_rules").Where("command_filter_id = ?", commandFilterId)
	dbCounter := r.GetDB(c).Table("command_filter_rules").Where("command_filter_id = ?", commandFilterId)

	if len(_type) > 0 {
		db = db.Where("type = ?", _type)
		dbCounter = dbCounter.Where("type = ?", _type)
	}

	if len(content) > 0 {
		db = db.Where("content like ?", "%"+content+"%")
		dbCounter = dbCounter.Where("content like ?", "%"+content+"%")
	}

	err = dbCounter.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if order == "" {
		order = "asc"
	} else if order == "ascend" {
		order = "asc"
	} else {
		order = "desc"
	}

	if field == "" {
		field = "priority"
	}

	err = db.Order(field + " " + order).Find(&o).Offset((pageIndex - 1) * pageSize).Limit(pageSize).Error
	if o == nil {
		o = make([]model.CommandFilterRule, 0)
	}
	return
}

func (r commandFilterRuleRepository) Create(c context.Context, m *model.CommandFilterRule) error {
	return r.GetDB(c).Create(m).Error
}

func (r commandFilterRuleRepository) DeleteById(c context.Context, id string) error {
	return r.GetDB(c).Where("id = ?", id).Delete(model.CommandFilterRule{}).Error
}

func (r commandFilterRuleRepository) DeleteByCommandFilterId(c context.Context, commandFilterId string) error {
	return r.GetDB(c).Where("command_filter_id = ?", commandFilterId).Delete(model.CommandFilterRule{}).Error
}

func (r commandFilterRuleRepository) FindByCommandFilterId(c context.Context, commandFilterId string) (items []model.CommandFilterRule, err error) {
	err = r.GetDB(c).Where("command_filter_id = ?", commandFilterId).Order("priority asc").Find(&items).Error
	return
}

func (r commandFilterRuleRepository) FindByCommandFilterIdSortByPriorityDesc(c context.Context, commandFilterId string) (items []model.CommandFilterRule, err error) {
	err = r.GetDB(c).Where("command_filter_id = ?", commandFilterId).Find(&items).Error
	return
}

func (r commandFilterRuleRepository) FindById(c context.Context, id string) (m *model.CommandFilterRule, err error) {
	err = r.GetDB(c).Where("id = ?", id).Find(&m).Error
	return
}

func (r commandFilterRuleRepository) UpdateById(c context.Context, m *model.CommandFilterRule, id string) error {
	m.ID = id
	return r.GetDB(c).Updates(m).Error
}
