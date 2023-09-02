define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'stock_bill/index' + location.search,
                    add_url: 'stock_bill/add',
                    // edit_url: 'stock_bill/edit',
                    del_url: 'stock_bill/del',
                    multi_url: 'stock_bill/multi',
                    import_url: 'stock_bill/import',
                    table: 'stock_bill',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {field: 'bill_num', title: __('Bill_num'), operate: 'LIKE'},
                        // {field: 'admin_id', title: __('Admin_id')},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
                        // {field: 'stockbillextend.id', title: __('Stockbillextend.id')},
                        // {field: 'stockbillextend.stock_bill_id', title: __('Stockbillextend.stock_bill_id')},
                        // {field: 'stockbillextend.out_warehouse_id', title: __('Stockbillextend.out_warehouse_id')},
                        // {field: 'stockbillextend.in_warehouse_id', title: __('Stockbillextend.in_warehouse_id')},
                        // {field: 'stockbillextend.goods_id', title: __('Stockbillextend.goods_id')},
                        // {field: 'stockbillextend.num', title: __('Stockbillextend.num')},
                        // {field: 'admin.id', title: __('Admin.id')},
                        // {field: 'admin.username', title: __('Admin.username'), operate: 'LIKE'},
                        {field: 'admin.nickname', title: __('Admin.nickname'), operate: 'LIKE'},
                        {
                            field: 'operate',
                            title: __('Operate'),
                            table: table,
                            events: Table.api.events.operate,
                            formatter: Table.api.formatter.operate,
                            buttons: [{
                                name: 'detail',
                                title: '账单详情',
                                text: __('Detail'),
                                classname: 'btn btn-info btn-xs btn-detail btn-dialog',
                                extend: 'data-toggle="tooltip" data-area=\'["1200px","650px"]\'',
                                icon: 'fa fa-list',
                                url: 'stock_bill/detail',
                                callback: function (data) {
                                    // Layer.alert("接收到回传数据：" + JSON.stringify(data), {title: "回传数据"});
                                }
                            }]
                        }
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
        },
        detail: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'stock_bill/detail',
                }
            });

            var table = $("#table");
            // 初始化表格
            table.bootstrapTable({
                url: 'stock_bill/detail/ids/' + bill_id ,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {field: 'id', title: __('Id')},
                        {field: 'stock_bill.bill_num', title: __('Bill_num'), operate: 'LIKE'},
                        {field: 'goods.name', title: '商品名称', operate: 'LIKE'},
                        {field: 'out_warehouse.name', title: '调出仓库', operate: 'LIKE'},
                        {field: 'in_warehouse.name', title: '调入仓库', operate: 'LIKE'},
                        {field: 'num', title: '数量（最小单位）', operate:'BETWEEN'},
                        {field: 'input_num', title: '账单填写数量', operate:'LIKE'},
                        {field: 'unit', title: '规格单位', operate:'LIKE'},
                        {
                            field: 'createtime',
                            title: __('createtime'),
                            operate: 'RANGE',
                            addclass: 'datetimerange',
                            formatter: Table.api.formatter.datetime
                        },
                        /*{
                            field: 'operate',
                            width: '130px',
                            title: __('Operate'),
                            table: table,
                            events: Table.api.events.operate,
                            buttons: [
                                {
                                    name: 'Restore',
                                    text: __('Restore'),
                                    classname: 'btn btn-xs btn-info btn-ajax btn-restoreit',
                                    icon: 'fa fa-rotate-left',
                                    url: 'bill/restore',
                                    refresh: true
                                },
                                {
                                    name: 'Destroy',
                                    text: __('Destroy'),
                                    classname: 'btn btn-xs btn-danger btn-ajax btn-destroyit',
                                    icon: 'fa fa-times',
                                    url: 'bill/destroy',
                                    refresh: true
                                }
                            ],
                            formatter: Table.api.formatter.operate
                        }*/
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
        },
        recyclebin: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    'dragsort_url': ''
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: 'stock_bill/recyclebin' + location.search,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {
                            field: 'deletetime',
                            title: __('Deletetime'),
                            operate: 'RANGE',
                            addclass: 'datetimerange',
                            formatter: Table.api.formatter.datetime
                        },
                        {
                            field: 'operate',
                            width: '130px',
                            title: __('Operate'),
                            table: table,
                            events: Table.api.events.operate,
                            buttons: [
                                {
                                    name: 'Restore',
                                    text: __('Restore'),
                                    classname: 'btn btn-xs btn-info btn-ajax btn-restoreit',
                                    icon: 'fa fa-rotate-left',
                                    url: 'stock_bill/restore',
                                    refresh: true
                                },
                                {
                                    name: 'Destroy',
                                    text: __('Destroy'),
                                    classname: 'btn btn-xs btn-danger btn-ajax btn-destroyit',
                                    icon: 'fa fa-times',
                                    url: 'stock_bill/destroy',
                                    refresh: true
                                }
                            ],
                            formatter: Table.api.formatter.operate
                        }
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
        },

        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});