import React, {useEffect} from 'react';
import {Checkbox, Form, Input, InputNumber, Modal, Radio} from "antd";
import commandFilterRuleApi from "../../api/command-filter-rule";

const api = commandFilterRuleApi;

const formItemLayout = {
    labelCol: {span: 6},
    wrapperCol: {span: 14},
};

const CommandFilterRuleModal = ({
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
    }, [visible])

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

                <Form.Item label="优先级" name='priority' rules={[{required: true}]} extra='优先级可选范围为 1-100 (数值越小越优先)'>
                    <InputNumber autoComplete="off" min={1} max={100}/>
                </Form.Item>

                <Form.Item label="命令内容" name='content' rules={[{required: true}]}>
                    <Input autoComplete="off"/>
                </Form.Item>

                <Form.Item label="命令类型" name='type' rules={[{required: true, message: '请选择类型'}]}>
                    <Radio.Group>
                        <Radio value={'command'}>命令</Radio>
                        <Radio value={'regexp'}>正则表达式</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label="规则" name='rule' rules={[{required: true, message: '请选择规则'}]}>
                    <Radio.Group>
                        <Radio value={'allow'}>允许</Radio>
                        <Radio value={'reject'}>拒绝</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label="激活" name='enabled' valuePropName="checked" rules={[{required: true}]}>
                    <Checkbox/>
                </Form.Item>
            </Form>
        </Modal>
    )
};

export default CommandFilterRuleModal;