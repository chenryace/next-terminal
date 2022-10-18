package api

import (
	"context"
	"github.com/labstack/echo/v4"
	"next-terminal/server/global/cache"
	"next-terminal/server/model"
	"next-terminal/server/repository"
	"next-terminal/server/service"
)

type ShareSessionApi struct {
}

func (api ShareSessionApi) ShareSessionCreateEndpoint(c echo.Context) error {
	var s model.ShareSession
	if err := c.Bind(&s); err != nil {
		return err
	}

	user, _ := GetCurrentAccount(c)

	shareSession, err := service.ShareSessionService.Create(s.AssetId, s.Upload, s.Download, s.Delete, s.Rename, s.Edit, s.FileSystem, s.CreateDir, s.Mode, s.Expiration, user.ID)
	if err != nil {
		return err
	}

	asset, err := repository.AssetRepository.FindById(context.TODO(), s.AssetId)
	if err != nil {
		return err
	}

	return Success(c, echo.Map{
		"id":         shareSession.ID,
		"upload":     shareSession.Upload,
		"download":   shareSession.Download,
		"delete":     shareSession.Delete,
		"rename":     shareSession.Rename,
		"edit":       shareSession.Edit,
		"fileSystem": shareSession.FileSystem,
		"url":        "/#/access?shareSessionId=" + shareSession.ID + "&assetName=" + asset.Name,
	})
}

func (api ShareSessionApi) ShareSessionGetEndpoint(c echo.Context) error {
	id := c.Param("id")
	shareSession, err := repository.ShareSessionRepository.FindById(context.TODO(), id)
	if err != nil {
		return err
	}
	return Success(c, shareSession)
}

func (api ShareSessionApi) ShareSessionPagingEndpoint(c echo.Context) error {

	return nil
}

func (api ShareSessionApi) ShareSessionDeleteEndpoint(c echo.Context) error {
	id := c.Param("id")
	cache.TokenManager.Delete(id)
	return Success(c, nil)
}
