package api

import (
	"context"
	"strconv"
	"strings"

	"next-terminal/server/common"
	"next-terminal/server/common/maps"
	"next-terminal/server/model"
	"next-terminal/server/repository"
	"next-terminal/server/service"
	"next-terminal/server/utils"

	"github.com/labstack/echo/v4"
)

type CommandFilterApi struct {
}

func (api CommandFilterApi) PagingEndpoint(c echo.Context) error {
	pageIndex, _ := strconv.Atoi(c.QueryParam("pageIndex"))
	pageSize, _ := strconv.Atoi(c.QueryParam("pageSize"))
	name := c.QueryParam("name")

	order := c.QueryParam("order")
	field := c.QueryParam("field")

	items, total, err := repository.CommandFilterRepository.Find(context.TODO(), pageIndex, pageSize, name, order, field)
	if err != nil {
		return err
	}

	return Success(c, maps.Map{
		"total": total,
		"items": items,
	})
}

func (api CommandFilterApi) GetEndpoint(c echo.Context) error {
	id := c.Param("id")

	item, err := repository.CommandFilterRepository.FindById(context.Background(), id)
	if err != nil {
		return err
	}

	return Success(c, item)
}

func (api CommandFilterApi) CreateEndpoint(c echo.Context) error {
	var item model.CommandFilter
	if err := c.Bind(&item); err != nil {
		return err
	}
	item.ID = utils.UUID()
	item.Created = common.NowJsonTime()

	if err := repository.CommandFilterRepository.Create(context.Background(), &item); err != nil {
		return err
	}
	return Success(c, "")
}

func (api CommandFilterApi) DeleteEndpoint(c echo.Context) error {
	ids := c.Param("id")
	split := strings.Split(ids, ",")
	if err := service.CommandFilterService.DeleteByIds(context.Background(), split); err != nil {
		return err
	}
	return Success(c, nil)
}

func (api CommandFilterApi) UpdateEndpoint(c echo.Context) error {
	id := c.Param("id")
	var item model.CommandFilter
	if err := c.Bind(&item); err != nil {
		return err
	}

	if err := repository.CommandFilterRepository.UpdateById(context.Background(), &item, id); err != nil {
		return err
	}
	return Success(c, "")
}

func (api CommandFilterApi) AllEndpoint(c echo.Context) error {
	items, err := repository.CommandFilterRepository.FindAll(context.Background())
	if err != nil {
		return err
	}
	return Success(c, items)
}
