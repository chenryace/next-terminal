import React, {useEffect, useState} from 'react';
import {Descriptions} from "antd";
import userApi from "../../../api/user";

const UserInfo = ({active, userId}) => {

    let [user, setUser] = useState({});

    useEffect(() => {
        const getUser = async (userId) => {
            let user = await userApi.getById(userId);
            if (user) {
                setUser(user);
            }
        };
        if (active && userId) {
            getUser(userId);
        }
    }, [active]);

    return (
        <div className={'page-detail-info'}>
            <Descriptions title="基本信息" column={1}>
                <Descriptions.Item label="用户名">{user['username']}</Descriptions.Item>
                <Descriptions.Item label="昵称">{user['nickname']}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{user['mail']}</Descriptions.Item>
                <Descriptions.Item label="状态">{user['status'] === 'enabled' ? '开启' : '关闭'}</Descriptions.Item>
                <Descriptions.Item label="双因素认证">{user['totpSecret']}</Descriptions.Item>
                <Descriptions.Item label="来源">{user['source'] === 'ldap' ? 'LDAP' : '数据库'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{user['created']}</Descriptions.Item>
            </Descriptions>
        </div>
    );
};

export default UserInfo;