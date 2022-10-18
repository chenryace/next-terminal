package repository

import (
	"context"

	"next-terminal/server/model"
)

type userGroupRepository struct {
	baseRepository
}

func (r userGroupRepository) FindAll(c context.Context) (o []model.UserGroup, err error) {
	err = r.GetDB(c).Find(&o).Error
	return
}

func (r userGroupRepository) Find(c context.Context, pageIndex, pageSize int, name, order, field string) (o []model.UserGroupForPage, total int64, err error) {
	db := r.GetDB(c).Table("user_groups")
	dbCounter := r.GetDB(c).Table("user_groups")
	if len(name) > 0 {
		db = db.Where("user_groups.name like ?", "%"+name+"%")
		dbCounter = dbCounter.Where("name like ?", "%"+name+"%")
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

	if field == "name" {
		field = "name"
	} else {
		field = "created"
	}

	err = db.Order("user_groups." + field + " " + order).Find(&o).Offset((pageIndex - 1) * pageSize).Limit(pageSize).Error
	if o == nil {
		o = make([]model.UserGroupForPage, 0)
	}
	return
}

func (r userGroupRepository) FindById(c context.Context, id string) (o model.UserGroup, err error) {
	err = r.GetDB(c).Where("id = ?", id).First(&o).Error
	return
}

func (r userGroupRepository) FindByName(c context.Context, name string) (o model.UserGroup, err error) {
	err = r.GetDB(c).Where("name = ?", name).First(&o).Error
	return
}

func (r userGroupRepository) ExistByName(ctx context.Context, name string) (exists bool, err error) {
	userGroup := model.UserGroup{}
	var count uint64
	err = r.GetDB(ctx).Table(userGroup.TableName()).Select("count(*)").
		Where("name = ?", name).
		Find(&count).
		Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r userGroupRepository) Create(c context.Context, o *model.UserGroup) (err error) {
	return r.GetDB(c).Create(o).Error
}

func (r userGroupRepository) Update(c context.Context, o *model.UserGroup) error {
	return r.GetDB(c).Updates(o).Error
}

func (r userGroupRepository) DeleteById(c context.Context, id string) (err error) {
	return r.GetDB(c).Where("id = ?", id).Delete(&model.UserGroup{}).Error
}

func (r userGroupRepository) FindAllUserGroupMembers() (c context.Context, o []model.UserGroupMember, err error) {
	err = r.GetDB(c).Find(&o).Error
	return
}
