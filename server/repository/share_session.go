package repository

import (
	"context"
	"next-terminal/server/model"
)

type shareSessionRepository struct {
	baseRepository
}

func (repo shareSessionRepository) Create(ctx context.Context, session *model.ShareSession) error {
	return repo.GetDB(ctx).Create(session).Error
}

func (repo shareSessionRepository) FindById(ctx context.Context, id string) (o model.ShareSession, err error) {
	err = repo.GetDB(ctx).Where("id = ?", id).First(&o).Error
	return
}

func (repo shareSessionRepository) DeleteById(ctx context.Context, id string) error {
	return repo.GetDB(ctx).Where("id = ?", id).Delete(&model.ShareSession{}).Error
}

func (repo shareSessionRepository) FindAll(ctx context.Context) (o []model.ShareSession, err error) {
	err = repo.GetDB(ctx).Find(&o).Error
	return
}

func (repo shareSessionRepository) FindByAssetIdAndCreator(ctx context.Context, assetId string, creator string) (o []model.ShareSession, err error) {
	err = repo.GetDB(ctx).Where("asset_id = ? and creator = ?", assetId, creator).Find(&o).Error
	return
}
