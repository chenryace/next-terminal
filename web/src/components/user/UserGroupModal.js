import React, {useEffect, useState} from 'react';
import {Form, Input, Modal, Select} from "antd";
import userGroupApi from "../../api/user-group";
import userApi from "../../api/user";

const api = userGroupApi;

const formItemLayout = {
    labelCol: {span: 6},
    wrapperCol: {span: 14},
};

const UserGroupModal = ({
                            visible,
                            handleOk,
                            handleCancel,
                            confirmLoading,
                            id,
                        }) => {

    const [form] = Form.useForm();

    let [users, setUsers] = useState([]);

    useEffect(() => {

        const getItem = async () => {
            let data = await api.getById(id);
            if (data) {
                form.setFieldsValue(data);
            }
        }

        const getUsers = async () => {
            let users = await userApi.GetAll();
            setUsers(users);
        }

        if (visible) {
            getUsers();
            if (id) {
                getItem();
            }
        } else {
            form.resetFields();
        }
    }, [visible]);

    return (
        <Modal
            title={id ? '更新用户组' : '新建用户组'}
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

            <Form form={form} {...formItemLayout}>
                <Form.Item name='id' noStyle>
                    <Input hidden={true}/>
                </Form.Item>

                <Form.Item label="名称" name='name' rules={[{required: true, message: '请输入用户组名称'}]}>
                    <Input autoComplete="off" placeholder="请输入用户组名称"/>
                </Form.Item>

                <Form.Item label="用户组成员" name='members'>
                    <Select
                        showSearch
                        mode="multiple"
                        allowClear
                        placeholder='用户组成员'
                        filterOption={false}
                    >
                        {users.map(d => <Select.Option key={d.id}
                                                       value={d.id}>{d.nickname}</Select.Option>)}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    )
};

export default UserGroupModal;
