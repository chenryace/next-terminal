import React, {Suspense} from 'react';
import {Link, Outlet, useLocation} from "react-router-dom";
import {Breadcrumb, Button, Dropdown, Layout, Menu, Popconfirm} from "antd";
import {CodeOutlined, DesktopOutlined, LogoutOutlined, UserOutlined} from "@ant-design/icons";
import {getCurrentUser} from "../service/permission";
import FooterComponent from "./FooterComponent";
import accountApi from "../api/account";
import LogoWithName from "../images/logo-with-name.png";
import Landing from "../components/Landing";
import {useTitle} from "../hook/title";

const {Header, Content} = Layout;

const breadcrumbNameMap = {
    '/my-asset': '我的资产',
    '/my-command': '我的指令',
    '/my-info': '个人中心',
};

const UserLayout = () => {

    const location = useLocation();
    let _current = location.pathname.split('/')[1];
    useTitle(breadcrumbNameMap['/' + _current], [_current]);

    const pathSnippets = location.pathname.split('/').filter(i => i);

    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        return (
            <Breadcrumb.Item key={url}>
                <Link to={url}>{breadcrumbNameMap[url]}</Link>
            </Breadcrumb.Item>
        );
    });

    const breadcrumbItems = [
        <Breadcrumb.Item key="home">
            <Link to="/my-asset">首页</Link>
        </Breadcrumb.Item>,
    ].concat(extraBreadcrumbItems);

    const menu = (
        <Menu>
            <Menu.Item>

                <Popconfirm
                    key='login-btn-pop'
                    title="您确定要退出登录吗?"
                    onConfirm={accountApi.logout}
                    okText="确定"
                    cancelText="取消"
                    placement="left"
                >
                    <LogoutOutlined/> 退出登录
                </Popconfirm>
            </Menu.Item>

        </Menu>
    );

    return (
        <Layout className="layout" style={{minHeight: '100vh'}}>
            <Header style={{padding: 0}}>
                <div className='km-header'>
                    <div style={{flex: '1 1 0%'}}>
                        <Link to={'/my-asset'}>
                            <img src={LogoWithName} alt='logo' width={120}/>
                        </Link>

                        <Link to={'/my-asset'}>
                            <Button type="text" style={{color: 'white'}}
                                    icon={<DesktopOutlined/>}>
                                我的资产
                            </Button>
                        </Link>

                        <Link to={'/my-command'}>
                            <Button type="text" style={{color: 'white'}}
                                    icon={<CodeOutlined/>}>
                                我的指令
                            </Button>
                        </Link>

                        <Link to={'/my-info'}>
                            <Button type="text" style={{color: 'white'}}
                                    icon={<UserOutlined/>}>
                                个人中心
                            </Button>
                        </Link>

                    </div>
                    <div className='km-header-right'>
                        <Dropdown overlay={menu}>
                                                <span className={'km-header-right-item'}>
                                                    {getCurrentUser()['nickname']}
                                                </span>
                        </Dropdown>
                    </div>
                </div>
            </Header>

            <Content className='nt-container'>
                <div style={{marginBottom: 16}}>
                    <Breadcrumb>{breadcrumbItems}</Breadcrumb>
                </div>
                <Suspense fallback={<Landing/>}>
                    <Outlet/>
                </Suspense>
            </Content>
            <FooterComponent/>
        </Layout>
    );
}

export default UserLayout;