import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import zhCN from 'antd/es/locale-provider/zh_CN';
import {ConfigProvider} from 'antd';
import {HashRouter as Router} from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/zh-cn';
import {QueryClient, QueryClientProvider,} from 'react-query';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const queryClient = new QueryClient();

ReactDOM.render(
    <ConfigProvider locale={zhCN}>
        <Router>
            <QueryClientProvider client={queryClient}>
                <App/>
            </QueryClientProvider>
        </Router>
    </ConfigProvider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

