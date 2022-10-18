import React, {useState} from 'react';
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Layout, Tabs} from "antd";
import StrategyInfo from "./StrategyInfo";

const StrategyDetail = () => {
    let params = useParams();
    const id = params['strategyId'];
    const searchParams = useSearchParams();
    const navigate = useNavigate();
    let key = searchParams[0].get('activeKey');
    key = key ? key : 'info';

    let [activeKey, setActiveKey] = useState(key);

    const handleTagChange = (key) => {
        setActiveKey(key);
        // navigate({
        //     search: createSearchParams({'activeKey': key}).toString()
        // })
    }

    return (
        <div>
            <Layout.Content className="page-detail-warp">
                <Tabs activeKey={activeKey} onChange={handleTagChange}>
                    <Tabs.TabPane tab="基本信息" key="info">
                        <StrategyInfo active={activeKey === 'info'} id={id}/>
                    </Tabs.TabPane>
                </Tabs>
            </Layout.Content>
        </div>
    );
};

export default StrategyDetail;