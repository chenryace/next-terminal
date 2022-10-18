package service

import (
	"context"
	"gorm.io/gorm"
	"next-terminal/server/common"
	"next-terminal/server/constant"
	"next-terminal/server/dto"
	"next-terminal/server/env"
	"next-terminal/server/global/cache"
	"next-terminal/server/log"
	"next-terminal/server/model"
	"next-terminal/server/repository"
	"next-terminal/server/utils"
	"time"
)

type shareSessionService struct {
	baseService
}

func (service shareSessionService) Create(assetId, upload, download, _delete, rename, edit, fileSystem, createDir, mode string, expiration common.JsonTime, userId string) (model.ShareSession, error) {
	if fileSystem != "1" {
		fileSystem = "0"
	}
	if upload != "1" {
		upload = "0"
	}
	if download != "1" {
		download = "0"
	}
	if _delete != "1" {
		_delete = "0"
	}
	if rename != "1" {
		rename = "0"
	}
	if edit != "1" {
		edit = "0"
	}
	if mode != constant.Native {
		mode = constant.Guacd
	} else {
		mode = constant.Native
	}

	s := model.ShareSession{
		ID:         "SS" + utils.LongUUID(),
		AssetId:    assetId,
		FileSystem: fileSystem,
		Upload:     upload,
		Download:   download,
		Delete:     _delete,
		Rename:     rename,
		Edit:       edit,
		CreateDir:  createDir,
		Creator:    userId,
		Mode:       mode,
		Created:    common.NowJsonTime(),
		Expiration: expiration,
	}

	return s, env.GetDB().Transaction(func(tx *gorm.DB) error {
		ctx := service.Context(tx)
		err := repository.ShareSessionRepository.Create(ctx, &s)
		if err != nil {
			return err
		}

		shareSessions, err := repository.ShareSessionRepository.FindByAssetIdAndCreator(ctx, assetId, userId)
		if err != nil {
			return err
		}
		for _, shareSession := range shareSessions {
			cache.TokenManager.Delete(shareSession.ID)
		}

		authorization := dto.Authorization{
			Token:    s.ID,
			Remember: false,
			Type:     constant.ShareSession,
			User: &model.User{
				ID:   s.ID,
				Type: constant.Anonymous,
			},
		}
		if s.Expiration.IsZero() {
			cache.TokenManager.Set(s.ID, authorization, cache.NoExpiration)
			log.Debugf("set share session %v with no expiration", s.ID)
		} else {
			duration := s.Expiration.Sub(time.Now())
			cache.TokenManager.Set(s.ID, authorization, duration)
			log.Debugf("set share session %v with %v expiration", s.ID, duration)
		}

		return nil
	})

}

func (service shareSessionService) Reload() error {
	shareSessions, err := repository.ShareSessionRepository.FindAll(context.TODO())
	if err != nil {
		return err
	}

	for _, s := range shareSessions {
		authorization := dto.Authorization{
			Token:    s.ID,
			Remember: false,
			Type:     constant.ShareSession,
			User: &model.User{
				ID:   s.ID,
				Type: constant.Anonymous,
			},
		}
		if s.Expiration.IsZero() {
			cache.TokenManager.Set(s.ID, authorization, cache.NoExpiration)
			log.Debugf("reload share session %v with no expiration", s.ID)
		} else {
			duration := s.Expiration.Sub(time.Now())
			if duration < 0 {
				if err := repository.ShareSessionRepository.DeleteById(context.TODO(), s.ID); err != nil {
					return err
				}
			} else {
				cache.TokenManager.Set(s.ID, authorization, duration)
				log.Debugf("reload share session %v with %v expiration", s.ID, duration)
			}
		}
	}
	return nil
}
