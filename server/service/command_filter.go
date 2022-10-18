package service

import (
	"context"
	"next-terminal/server/repository"
)

type commandFilterService struct {
	baseService
}

func (s commandFilterService) DeleteByIds(ctx context.Context, ids []string) error {
	return s.Transaction(ctx, func(ctx context.Context) error {
		for _, id := range ids {
			if err := repository.CommandFilterRepository.DeleteById(ctx, id); err != nil {
				return err
			}
			if err := repository.CommandFilterRuleRepository.DeleteByCommandFilterId(ctx, id); err != nil {
				return err
			}
		}

		return nil
	})
}

type commandFilterRuleService struct {
	baseService
}

func (s commandFilterRuleService) DeleteByIds(ctx context.Context, ids []string) error {
	return s.Transaction(ctx, func(ctx context.Context) error {
		for _, id := range ids {
			if err := repository.CommandFilterRuleRepository.DeleteById(ctx, id); err != nil {
				return err
			}
		}

		return nil
	})
}
