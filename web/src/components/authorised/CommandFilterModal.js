import React, {useEffect} from 'react';
import {Form, Input, Modal} from "antd";
import commandFilterApi from "../../api/command-filter";

const api = commandFilterApi;

const formItemLayout = {
    labelCol: {span: 6},
    wrapperCol: {span: 14},
};

const CommandFilterModal = ({
                                visible,
                                handleOk,
                                handleCancel,
                                confirmLoading,
                                id,
                                userId
                            }) => {

    const [form] = Form.useForm();

    useEffect(() => {

        const getItem = async () => {
            let data = await api.getById(id);
            if (data) {
                form.setFieldsValue(data);
            }
        }
        if (visible && id) {
            getItem();
        } else {
            form.setFieldsValue({
                type: 'command',
                priority: 50,
                rule: 'reject',
                enabled: true
            });
        }
    }, [visible]);

    return (
        <Modal
            title={id ? '更新命令过滤器' : '新建命令过滤器'}
            visible={visible}
            maskClosable={false}
            destroyOnClose={true}
            onOk={() => {
                form
                    .validateFields()
                    .then(async values => {
                        values['userId'] = userId;
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

                <Form.Item label="名称" name='name' rules={[{required: true}]}>
                    <Input autoComplete="off" placeholder="请输入名称"/>
                </Form.Item>
            </Form>
        </Modal>
    )
};

export default CommandFilterModal;
