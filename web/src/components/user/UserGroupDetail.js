import React, {useState} from 'react';
import {createSearchParams, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Tabs} from "antd";
import UserGroupInfo from "./UserGroupInfo";
import UserAsset from "./user/UserAsset";

const UserGroupDetail = () => {
    let params = useParams();
    const id = params['userGroupId'];
    const searchParams = useSearchParams();
    const navigate = useNavigate();
    let key = searchParams[0].get('activeKey');
    key = key ? key : 'info';

    let [activeKey, setActiveKey] = useState(key);

    const handleTagChange = (key) => {
        setActiveKey(key);
        navigate({
            search: createSearchParams({'activeKey': key}).toString()
        })
    }

    return (
        <div>
            <div className="page-detail-warp">
                <Tabs activeKey={activeKey} onChange={handleTagChange}>
                    <Tabs.TabPane tab="基本信息" key="info">
                        <UserGroupInfo active={activeKey === 'info'} id={id}/>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="授权的资产" key="asset">
                        <UserAsset active={activeKey === 'asset'} id={id} type={'userGroupId'}/>
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default UserGroupDetail;