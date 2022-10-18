package api

import (
	"context"
	"strconv"
	"strings"

	"next-terminal/server/common/maps"
	"next-terminal/server/model"
	"next-terminal/server/repository"
	"next-terminal/server/service"
	"next-terminal/server/utils"

	"github.com/labstack/echo/v4"
)

type CommandFilterRuleApi struct {
}

func (api CommandFilterRuleApi) PagingEndpoint(c echo.Context) error {
	pageIndex, _ := strconv.Atoi(c.QueryParam("pageIndex"))
	pageSize, _ := strconv.Atoi(c.QueryParam("pageSize"))
	commandFilterId := c.QueryParam("commandFilterId")
	_type := c.QueryParam("type")
	content := c.QueryParam("content")

	order := c.QueryParam("order")
	field := c.QueryParam("field")

	items, total, err := repository.CommandFilterRuleRepository.Find(context.TODO(), pageIndex, pageSize, commandFilterId, _type, content, order, field)
	if err != nil {
		return err
	}

	return Success(c, maps.Map{
		"total": total,
		"items": items,
	})
}

func (api CommandFilterRuleApi) GetEndpoint(c echo.Context) error {
	id := c.Param("id")

	item, err := repository.CommandFilterRuleRepository.FindById(context.Background(), id)
	if err != nil {
		return err
	}

	return Success(c, item)
}

func (api CommandFilterRuleApi) CreateEndpoint(c echo.Context) error {
	var item model.CommandFilterRule
	if err := c.Bind(&item); err != nil {
		return err
	}
	item.ID = utils.UUID()

	if err := repository.CommandFilterRuleRepository.Create(context.Background(), &item); err != nil {
		return err
	}
	return Success(c, "")
}

func (api CommandFilterRuleApi) DeleteEndpoint(c echo.Context) error {
	ids := c.Param("id")
	split := strings.Split(ids, ",")
	if err := service.CommandFilterRuleService.DeleteByIds(context.Background(), split); err != nil {
		return err
	}
	return Success(c, nil)
}

func (api CommandFilterRuleApi) UpdateEndpoint(c echo.Context) error {
	id := c.Param("id")
	var item model.CommandFilterRule
	if err := c.Bind(&item); err != nil {
		return err
	}

	if err := repository.CommandFilterRuleRepository.UpdateById(context.Background(), &item, id); err != nil {
		return err
	}
	return Success(c, "")
}
