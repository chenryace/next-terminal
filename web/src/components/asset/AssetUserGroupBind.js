import React, {useEffect, useState} from 'react';
import {Form, Modal, Select} from "antd";
import authorisedApi from "../../api/authorised";
import userGroupApi from "../../api/user-group";
import strategyApi from "../../api/strategy";
import commandFilterApi from "../../api/command-filter";

const formItemLayout = {
    labelCol: {span: 6},
    wrapperCol: {span: 14},
};


const AssetUserGroupBind = ({id, visible, handleOk, handleCancel, confirmLoading}) => {
    const [form] = Form.useForm();

    let [selectedUserGroupIds, setSelectedUserGroupIds] = useState([]);
    let [userGroups, setUserGroups] = useState([]);
    let [commandFilters, setCommandFilters] = useState([]);
    let [strategies, setStrategies] = useState([]);

    useEffect(() => {
        async function fetchData() {

            let queryParam = {'key': 'userGroupId', 'assetId': id};

            let items = await authorisedApi.GetSelected(queryParam);
            setSelectedUserGroupIds(items);

            let userGroups = await userGroupApi.GetAll();
            setUserGroups(userGroups);

            let strategies = await strategyApi.GetAll();
            setStrategies(strategies);

            let commandFilters = await commandFilterApi.GetAll();
            setCommandFilters(commandFilters);
        }

        if (visible) {
            fetchData();
        } else {
            form.resetFields();
        }
    }, [visible])

    return (
        <Modal
            title={'用户授权'}
            visible={visible}
            maskClosable={false}
            destroyOnClose={true}
            onOk={() => {
                form
                    .validateFields()
                    .then(async values => {
                        let ok = await handleOk(values);
                        if (ok) {
                            form.resetFields();
                        }
                    });
            }}
            onCancel={() => {
                form.resetFields();
                handleCancel();
            }}
            confirmLoading={confirmLoading}
            okText='确定'
            cancelText='取消'
        >

            <Form form={form} {...formItemLayout} >

                <Form.Item label="用户组" name='userGroupIds' rules={[{required: true, message: '请选择用户组'}]}>
                    <Select
                        mode="multiple"
                        allowClear
                        style={{width: '100%'}}
                        placeholder="请选择用户组"
                    >
                        {userGroups.map(item => {
                            return <Select.Option key={item.id}
                                                  disabled={selectedUserGroupIds.includes(item.id)}>{item.name}</Select.Option>
                        })}
                    </Select>
                </Form.Item>

                <Form.Item label="命令过滤器" name='commandFilterId' extra={'可控制授权用户允许或不允许执行某些指令'}>
                    <Select
                        allowClear
                        style={{width: '100%'}}
                        placeholder="此字段不是必填的"
                    >
                        {commandFilters.map(item => {
                            return <Select.Option key={item.id}>{item.name}</Select.Option>
                        })}
                    </Select>
                </Form.Item>

                <Form.Item label="授权策略" name='strategyId' extra={'可控制授权用户上传下载文件等功能'}>
                    <Select
                        allowClear
                        style={{width: '100%'}}
                        placeholder="此字段不是必填的"
                    >
                        {strategies.map(item => {
                            return <Select.Option key={item.id}>{item.name}</Select.Option>
                        })}
                    </Select>
                </Form.Item>

            </Form>
        </Modal>
    )
};

export default AssetUserGroupBind;