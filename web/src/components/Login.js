import React, {useEffect, useState} from 'react';
import {Button, Card, Checkbox, Form, Input, message, Modal, Typography} from "antd";
import './Login.css'
import request from "../common/request";
import {LockOutlined, LockTwoTone, UserOutlined} from '@ant-design/icons';
import {setToken} from "../utils/utils";
import accountApi from "../api/account";
import brandingApi from "../api/branding";
import strings from "../utils/strings";

const {Title, Text} = Typography;

const LoginForm = () => {

    let [inLogin, setInLogin] = useState(false);
    let [branding, setBranding] = useState({});

    useEffect(() => {
        const x = async () => {
            let branding = await brandingApi.getBranding();
            document.title = branding['name'];
            setBranding(branding);
        }
        x();
    }, []);

    const afterLoginSuccess = async (token) => {
        // 跳转登录
        sessionStorage.removeItem('current');
        sessionStorage.removeItem('openKeys');
        setToken(token);

        let user = await accountApi.getUserInfo();
        if (user) {
            if (user['type'] === 'user') {
                window.location.href = "/my-asset"
            } else {
                window.location.href = "/"
            }
        }
    }

    const login = async (values) => {
        let result = await request.post('/login', values);
        if (result['code'] === 1) {
            Modal.destroyAll();
            await afterLoginSuccess(result['data']);
        }
    }

    const handleOk = (loginAccount, totp) => {
        if (!strings.hasText(totp)) {
            message.warn("请输入双因素认证码");
            return false;
        }
        loginAccount['totp'] = totp;
        login(loginAccount);
        return false;
    }

    const showTOTP = (loginAccount) => {
        let value = '';
        Modal.confirm({
            title: '双因素认证',
            icon: <LockTwoTone/>,
            content: <Input onChange={e => value = e.target.value} onPressEnter={() => handleOk(loginAccount, value)}
                            placeholder="请输入双因素认证码"/>,
            onOk: () => handleOk(loginAccount, value),
        });
    }

    const handleSubmit = async params => {
        setInLogin(true);

        try {
            let result = await request.post('/login', params);
            if (result.code === 100) {
                // 进行双因素认证
                showTOTP(params);
                return;
            }
            if (result.code !== 1) {
                return;
            }

            afterLoginSuccess(result['data']);
        } catch (e) {
            message.error(e.message);
        } finally {
            setInLogin(false);
        }
    };

    return (
        <div style={{width: '100vw', height: '100vh', backgroundColor: '#fafafa'}}>
            <Card className='login-card' title={null}>
                <div style={{textAlign: "center", margin: '15px auto 30px auto', color: '#1890ff'}}>
                    <Title level={1}>{branding['name']}</Title>
                    {/*<Text>一个轻量级的堡垒机系统</Text>*/}
                </div>
                <Form onFinish={handleSubmit} className="login-form">
                    <Form.Item name='username' rules={[{required: true, message: '请输入登录账号！'}]}>
                        <Input prefix={<UserOutlined/>} placeholder="登录账号"/>
                    </Form.Item>
                    <Form.Item name='password' rules={[{required: true, message: '请输入登录密码！'}]}>
                        <Input.Password prefix={<LockOutlined/>} placeholder="登录密码"/>
                    </Form.Item>
                    <Form.Item name='remember' valuePropName='checked' initialValue={false}>
                        <Checkbox>保持登录</Checkbox>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-form-button"
                                loading={inLogin}>
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>

    );
}

export default LoginForm;
