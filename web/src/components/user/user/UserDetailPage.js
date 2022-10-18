import React, {useState} from 'react';
import {Tabs} from "antd";
import UserInfo from "./UserInfo";
import UserLoginPolicy from "./UserLoginPolicy";
import UserAsset from "./UserAsset";
import {createSearchParams, useNavigate, useParams, useSearchParams} from "react-router-dom";

const UserDetail = () => {

    let params = useParams();
    const id = params['userId'];
    const [searchParams, setSearchParam] = useSearchParams();
    const navigate = useNavigate();
    let key = searchParams.get('activeKey');
    key = key ? key : 'info';

    let [activeKey, setActiveKey] = useState(key);

    const handleTagChange = (key) => {
        setActiveKey(key);
        navigate({
            search: createSearchParams({'activeKey': key}).toString()
        })
    }

    return (
        <div className="page-detail-warp">
            <Tabs activeKey={activeKey} onChange={handleTagChange}>
                <Tabs.TabPane tab="基本信息" key="info">
                    <UserInfo active={activeKey === 'info'} userId={id}/>
                </Tabs.TabPane>
                <Tabs.TabPane tab="授权的资产" key="asset">
                    <UserAsset active={activeKey === 'asset'} id={id} type={'userId'}/>
                </Tabs.TabPane>
                <Tabs.TabPane tab="登录策略" key="login-policy">
                    <UserLoginPolicy active={activeKey === 'login-policy'} userId={id}/>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
}

export default UserDetail;