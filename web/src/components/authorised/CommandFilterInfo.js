import React, {useEffect, useState} from 'react';
import {Descriptions} from "antd";
import commandFilterApi from "../../api/command-filter";

const api = commandFilterApi;

const CommandFilterInfo = ({active, id}) => {

    let [item, setItem] = useState({});

    useEffect(() => {
        const getItem = async (id) => {
            let item = await api.getById(id);
            if (item) {
                setItem(item);
            }
        };
        if (active && id) {
            getItem(id);
        }
    }, [active]);

    return (
        <div className={'page-detail-info'}>
            <Descriptions column={1}>
                <Descriptions.Item label="名称">{item['name']}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{item['created']}</Descriptions.Item>
            </Descriptions>
        </div>
    );
};

export default CommandFilterInfo;