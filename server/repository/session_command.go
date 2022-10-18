package repository

import (
	"context"

	"next-terminal/server/model"
)

type sessionCommandRepository struct {
	baseRepository
}

func (r sessionCommandRepository) Find(c context.Context, pageIndex, pageSize int, sessionId, command, order, field string) (o []model.SessionCommand, total int64, err error) {
	m := model.SessionCommand{}
	db := r.GetDB(c).Table(m.TableName())
	dbCounter := r.GetDB(c).Table(m.TableName())

	if len(sessionId) > 0 {
		db = db.Where("session_id = ?", sessionId)
		dbCounter = dbCounter.Where("session_id = ?", sessionId)
	}

	if command != "" {
		db = db.Where("command like ?", "%"+command+"%")
		dbCounter = dbCounter.Where("command like ?", "%"+command+"%")
	}

	err = dbCounter.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if order == "ascend" {
		order = "asc"
	} else {
		order = "desc"
	}

	if field == "command" {
		field = "command"
	} else {
		field = "created"
	}

	err = db.Order(field + " " + order).Find(&o).Offset((pageIndex - 1) * pageSize).Limit(pageSize).Error
	if o == nil {
		o = make([]model.SessionCommand, 0)
	}
	return
}

func (r sessionCommandRepository) Create(c context.Context, m *model.SessionCommand) error {
	return r.GetDB(c).Create(m).Error
}

func (r sessionCommandRepository) DeleteBySessionId(c context.Context, sessionId string) error {
	return r.GetDB(c).Where("session_id = ?", sessionId).Delete(model.SessionCommand{}).Error
}

func (r sessionCommandRepository) CountBySessionId(c context.Context, sessionId string) (total int64, err error) {
	err = r.GetDB(c).Find(&model.SessionCommand{}).Where("session_id = ?", sessionId).Count(&total).Error
	return
}
