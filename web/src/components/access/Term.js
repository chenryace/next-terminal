import React, {useEffect, useState} from 'react';
import {useSearchParams} from "react-router-dom";
import {Terminal} from "xterm";
import {FitAddon} from "xterm-addon-fit";
import {getToken} from "../../utils/utils";
import request from "../../common/request";
import {Affix, Button, Drawer, Dropdown, Menu, message} from "antd";
import Message from "./Message";
import qs from "qs";
import {wsServer} from "../../common/env";
import Draggable from "react-draggable";
import {CodeOutlined, FolderOutlined, LineChartOutlined} from "@ant-design/icons";
import FileSystem from "../devops/FileSystem";
import "xterm/css/xterm.css"
import Stats from "./Stats";
import {debounce} from "../../utils/fun";
import commandApi from "../../api/command";
import strings from "../../utils/strings";
import workCommandApi from "../../api/worker/command";
import {xtermScrollPretty} from "../../utils/xterm-scroll-pretty";

const Term = () => {

    const [searchParams, _] = useSearchParams();
    const assetId = searchParams.get('assetId');
    const assetName = searchParams.get('assetName');
    const isWorker = searchParams.get('isWorker');
    const [box, setBox] = useState({width: window.innerWidth, height: window.innerHeight});

    let [commands, setCommands] = useState([]);
    let [term, setTerm] = useState();
    let [fitAddon, setFitAddon] = useState();
    let [websocket, setWebsocket] = useState();
    let [session, setSession] = useState({});
    let [fileSystemVisible, setFileSystemVisible] = useState(false);
    let [statsVisible, setStatsVisible] = useState(false);
    let [enterBtnZIndex, setEnterBtnZIndex] = useState(999);

    const createSession = async (assetsId) => {
        let result = await request.post(`/sessions?assetId=${assetsId}&mode=native`);
        if (result['code'] !== 1) {
            return [undefined, result['message']];
        }
        return [result['data'], ''];
    }

    const writeErrorMessage = (term, message) => {
        term.writeln(`\x1B[1;3;31m${message}\x1B[0m `);
    }

    const updateSessionStatus = async (sessionId) => {
        let result = await request.post(`/sessions/${sessionId}/connect`);
        if (result['code'] !== 1) {
            message.error(result['message']);
        }
    }

    const writeCommand = (command) => {
        if (websocket) {
            websocket.send(new Message(Message.Data, command));
        }
    }

    const getCommands = async () => {
        if (strings.hasText(isWorker)) {
            let items = await workCommandApi.getAll();
            setCommands(items);
        } else {
            let items = await commandApi.getAll();
            setCommands(items);
        }
    }

    const focus = () => {
        if (term) {
            term.focus();
        }
    }

    const fit = () => {
        if (fitAddon) {
            fitAddon.fit();
        }
    }

    useEffect(() => {
        if (term && websocket && fitAddon && websocket.readyState === WebSocket.OPEN) {
            fit();
            focus();
            let terminalSize = {
                cols: term.cols,
                rows: term.rows
            }
            websocket.send(new Message(Message.Resize, window.btoa(JSON.stringify(terminalSize))).toString());
        }

    }, [box.width, box.height]);

    const onWindowResize = () => {
        setBox({width: window.innerWidth, height: window.innerHeight});
    };

    const init = async (assetId) => {
        let term = new Terminal({
            fontFamily: 'monaco, Consolas, "Lucida Console", monospace',
            fontSize: 15,
            theme: {
                background: '#1b1b1b'
            },
        });
        let elementTerm = document.getElementById('terminal');
        term.open(elementTerm);
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddon.fit();
        term.focus();

        if (!assetId) {
            writeErrorMessage(term, `参数缺失，请关闭此页面后重新打开。`)
            return;
        }

        let [session, errMsg] = await createSession(assetId);
        if (!session) {
            writeErrorMessage(term, `创建会话失败，${errMsg}`)
            return;
        }
        setSession(session);
        let sessionId = session['id'];

        term.writeln('trying to connect to the server ...');

        document.body.oncopy = (event) => {
            event.preventDefault();
            if (session['copy'] === '0') {
                message.warn('禁止复制')
                return false;
            } else {
                return true;
            }
        }

        document.body.onpaste = (event) => {
            event.preventDefault();
            if (session['paste'] === '0') {
                message.warn('禁止粘贴')
                return false;
            } else {
                return true;
            }
        }

        let token = getToken();
        let params = {
            'cols': term.cols,
            'rows': term.rows,
            'X-Auth-Token': token
        };

        let paramStr = qs.stringify(params);

        let webSocket = new WebSocket(`${wsServer}/sessions/${sessionId}/ssh?${paramStr}`);

        let pingInterval;
        webSocket.onopen = (e => {
            pingInterval = setInterval(() => {
                webSocket.send(new Message(Message.Ping, "").toString());
            }, 10000);
            xtermScrollPretty();
        });

        webSocket.onerror = (e) => {
            writeErrorMessage(term, `websocket error ${e.data}`)
        }

        webSocket.onclose = (e) => {
            term.writeln("connection is closed.");
            if (pingInterval) {
                clearInterval(pingInterval);
            }
        }

        term.onData(data => {
            if (webSocket !== undefined) {
                webSocket.send(new Message(Message.Data, data).toString());
            }
        });

        webSocket.onmessage = (e) => {
            let msg = Message.parse(e.data);
            switch (msg['type']) {
                case Message.Connected:
                    term.clear();
                    updateSessionStatus(sessionId);
                    getCommands();
                    break;
                case Message.Data:
                    term.write(msg['content']);
                    break;
                case Message.Closed:
                    term.writeln(`\x1B[1;3;31m${msg['content']}\x1B[0m `);
                    webSocket.close();
                    break;
                default:
                    break;
            }
        }

        setTerm(term);
        setFitAddon(fitAddon);
        setWebsocket(webSocket);
    }

    const handleUnload = (e) => {
        const message = "要离开网站吗？";
        (e || window.event).returnValue = message; //Gecko + IE
        return message;
    }

    useEffect(() => {
        document.title = assetName;
        window.addEventListener('beforeunload', handleUnload);

        init(assetId);

        let resize = debounce(() => {
            onWindowResize();
        });

        window.addEventListener('resize', resize);

        return () => {
            if (websocket) {
                websocket.close();
            }
            window.removeEventListener('resize', resize);
            window.removeEventListener('beforeunload', handleUnload);
        }
    }, [assetId]);

    const cmdMenuItems = commands.map(item => {
        return {
            key: item['id'],
            label: item['name'],
        };
    });

    const handleCmdMenuClick = (e) => {
        for (const command of commands) {
            if (command['id'] === e.key) {
                writeCommand(command['content']);
            }
        }
    }

    return (
        <div>
            <div id='terminal' style={{
                overflow: 'hidden',
                height: box.height,
                width: box.width,
                backgroundColor: '#1b1b1b'
            }}/>

            <Draggable>
                <Affix style={{position: 'absolute', top: 50, right: 50, zIndex: enterBtnZIndex}}>
                    <Button icon={<FolderOutlined/>} onClick={() => {
                        setFileSystemVisible(true);
                        setEnterBtnZIndex(999); // xterm.js 输入框的zIndex是1000，在弹出文件管理页面后要隐藏此按钮
                    }}/>
                </Affix>
            </Draggable>

            <Draggable>
                <Affix style={{position: 'absolute', top: 50, right: 100, zIndex: enterBtnZIndex}}>
                    <Dropdown overlay={<Menu onClick={handleCmdMenuClick} items={cmdMenuItems}/>} trigger={['click']}
                              placement="bottomLeft">
                        <Button icon={<CodeOutlined/>}/>
                    </Dropdown>
                </Affix>
            </Draggable>

            <Draggable>
                <Affix style={{position: 'absolute', top: 100, right: 100, zIndex: enterBtnZIndex}}>
                    <Button icon={<LineChartOutlined/>} onClick={() => {
                        console.log('session', session)
                        setStatsVisible(true);
                        setEnterBtnZIndex(999);
                    }}/>
                </Affix>
            </Draggable>

            <Drawer
                title={'会话详情'}
                placement="right"
                width={window.innerWidth * 0.8}
                closable={true}
                // maskClosable={false}
                onClose={() => {
                    setFileSystemVisible(false);
                    setEnterBtnZIndex(1001); // xterm.js 输入框的zIndex是1000，在弹出文件管理页面后要隐藏此按钮
                    focus();
                }}
                visible={fileSystemVisible}
            >
                <FileSystem
                    storageId={session['id']}
                    storageType={'sessions'}
                    upload={session['upload'] === '1'}
                    download={session['download'] === '1'}
                    delete={session['delete'] === '1'}
                    rename={session['rename'] === '1'}
                    edit={session['edit'] === '1'}
                    minHeight={window.innerHeight - 103}/>
            </Drawer>

            <Drawer
                title={'状态信息'}
                placement="right"
                width={window.innerWidth * 0.8}
                closable={true}
                onClose={() => {
                    setStatsVisible(false);
                    setEnterBtnZIndex(1001);

                    focus();
                }}
                visible={statsVisible}
            >
                <Stats sessionId={session['id']} visible={statsVisible}/>
            </Drawer>
        </div>
    );
};

export default Term;