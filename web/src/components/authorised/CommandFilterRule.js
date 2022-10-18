import React, {useState} from 'react';
import {Button, Popconfirm, Tag} from "antd";
import {ProTable} from "@ant-design/pro-components";
import commandFilterRuleApi from "../../api/command-filter-rule";
import CommandFilterRuleModal from "./CommandFilterRuleModal";
import Show from "../../dd/fi/show";

const api = commandFilterRuleApi;
const actionRef = React.createRef();

const CommandFilterRule = ({id}) => {

    let [visible, setVisible] = useState(false);
    let [confirmLoading, setConfirmLoading] = useState(false);
    let [selectedRowKey, setSelectedRowKey] = useState(undefined);

    const columns = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
        },
        {
            title: '优先级',
            key: 'priority',
            dataIndex: 'priority',
            sorter: true,
            hideInSearch: true,
        },
        {
            title: '内容',
            key: 'content',
            dataIndex: 'content',
            sorter: true,
        },
        {
            title: '类型',
            key: 'type',
            dataIndex: 'type',
            hideInSearch: true,
            render: (text => {
                if (text === 'regexp') {
                    return '正则表达式';
                } else {
                    return '命令';
                }
            })
        },
        {
            title: '动作',
            key: 'rule',
            dataIndex: 'rule',
            hideInSearch: true,
            render: (text => {
                if (text === 'allow') {
                    return '允许';
                } else {
                    return '拒绝';
                }
            })
        },
        {
            title: '激活',
            key: 'enabled',
            dataIndex: 'enabled',
            hideInSearch: true,
            render: (text => {
                if (text === true) {
                    return <Tag color="blue">是</Tag>;
                } else {
                    return <Tag>否</Tag>;
                }
            })
        },
        {
            title: '操作',
            valueType: 'option',
            key: 'option',
            render: (text, record, _, action) => [
                <Show menu={'command-filter-rule-edit'}>
                    <a
                        key="edit"
                        onClick={() => {
                            setVisible(true);
                            setSelectedRowKey(record['id']);
                        }}
                    >
                        编辑
                    </a>
                </Show>
                ,
                <Show menu={'command-filter-rule-del'}>
                    <Popconfirm
                        key={'confirm-delete'}
                        title="您确认要删除此行吗?"
                        onConfirm={async () => {
                            await api.deleteById(record.id);
                            actionRef.current.reload();
                        }}
                        okText="确认"
                        cancelText="取消"
                    >
                        <a key='delete' className='danger'>删除</a>
                    </Popconfirm>
                </Show>
                ,
            ],
        },
    ];

    return (
        <div>
            <ProTable
                columns={columns}
                actionRef={actionRef}
                request={async (params = {}, sort, filter) => {

                    let field = '';
                    let order = '';
                    if (Object.keys(sort).length > 0) {
                        field = Object.keys(sort)[0];
                        order = Object.values(sort)[0];
                    }

                    let queryParams = {
                        pageIndex: params.current,
                        pageSize: params.pageSize,
                        name: params.name,
                        commandFilterId: id,
                        field: field,
                        order: order
                    }
                    let result = await commandFilterRuleApi.getPaging(queryParams);
                    return {
                        data: result['items'],
                        success: true,
                        total: result['total']
                    };
                }}
                rowKey="id"
                search={{
                    labelWidth: 'auto',
                }}
                pagination={{
                    pageSize: 10,
                }}
                dateFormatter="string"
                headerTitle="命令过滤器规则"
                toolBarRender={() => [
                    <Show menu={'command-filter-rule-add'}>
                        <Button key="button" type="primary" onClick={() => {
                            setVisible(true);
                        }}>
                            新建
                        </Button>
                    </Show>
                    ,
                ]}
            />

            <CommandFilterRuleModal
                id={selectedRowKey}
                visible={visible}
                confirmLoading={confirmLoading}
                handleCancel={() => {
                    setVisible(false);
                    setSelectedRowKey(undefined);
                }}
                handleOk={async (values) => {
                    setConfirmLoading(true);
                    values['commandFilterId'] = id;
                    try {
                        let success;
                        if (values['id']) {
                            success = await api.updateById(values['id'], values);
                        } else {
                            success = await api.create(values);
                        }
                        if (success) {
                            setVisible(false);
                        }
                        actionRef.current.reload();
                    } finally {
                        setConfirmLoading(false);
                    }
                }}
            />
        </div>
    );
};

export default CommandFilterRule;