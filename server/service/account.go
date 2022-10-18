package service

import (
	"context"
	"next-terminal/server/common/sets"
	"next-terminal/server/model"
	"next-terminal/server/repository"
	"next-terminal/server/utils"
)

var AccountService = &accountService{}

type accountService struct {
}

func (s *accountService) FindMyAssetPaging(pageIndex, pageSize int, name, protocol, tags string, userId string, order, field string) (o []model.AssetForPage, total int64, err error) {
	assetIdList, err := s.getAssetIdListByUserId(userId)
	if err != nil {
		return nil, 0, err
	}

	items, total, err := repository.AssetRepository.FindMyAssets(context.TODO(), pageIndex, pageSize, name, protocol, tags, assetIdList, order, field)
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (s *accountService) FindMyAssetTags(ctx context.Context, userId string) ([]string, error) {
	assetIdList, err := s.getAssetIdListByUserId(userId)
	if err != nil {
		return nil, err
	}
	tags, err := repository.AssetRepository.FindMyAssetTags(ctx, assetIdList)
	return tags, err
}

func (s *accountService) getAssetIdListByUserId(userId string) ([]string, error) {
	set := sets.NewStringSet()
	authorisedByUser, err := repository.AuthorisedRepository.FindByUserId(context.Background(), userId)
	if err != nil {
		return nil, err
	}
	for _, authorised := range authorisedByUser {
		set.Add(authorised.AssetId)
	}

	userGroupIds, err := repository.UserGroupMemberRepository.FindUserGroupIdsByUserId(context.Background(), userId)
	if err != nil {
		return nil, err
	}
	authorisedByUserGroup, err := repository.AuthorisedRepository.FindByUserGroupIdIn(context.Background(), userGroupIds)
	if err != nil {
		return nil, err
	}
	for _, authorised := range authorisedByUserGroup {
		set.Add(authorised.AssetId)
	}

	return set.ToArray(), nil
}

func (s *accountService) CheckPermission(assetId, userId string) (bool, error) {
	assetIdList, err := s.getAssetIdListByUserId(userId)
	if err != nil {
		return false, err
	}
	return utils.Contains(assetIdList, assetId), nil
}
