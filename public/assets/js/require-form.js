define(['jquery', 'bootstrap', 'upload', 'validator', 'validator-lang'], function ($, undefined, Upload, Validator, undefined) {
    //这两个变量用来 分组 账单内的数据
    var goodsKey = 1;
    var unitKey = 0;

    var Form = {
        config: {
            fieldlisttpl: '<dd class="form-inline"><input type="text" name="<%=name%>[<%=index%>][key]" class="form-control" value="<%=row.key%>" size="10" /> <input type="text" name="<%=name%>[<%=index%>][value]" class="form-control" value="<%=row.value%>" /> <span class="btn btn-sm btn-danger btn-remove"><i class="fa fa-times"></i></span> <span class="btn btn-sm btn-primary btn-dragsort"><i class="fa fa-arrows"></i></span></dd>'
        },
        events: {
            validator: function (form, success, error, submit) {
                if (!form.is("form"))
                    return;
                //绑定表单事件
                form.validator($.extend({
                    validClass: 'has-success',
                    invalidClass: 'has-error',
                    bindClassTo: '.form-group',
                    formClass: 'n-default n-bootstrap',
                    msgClass: 'n-right',
                    stopOnError: true,
                    display: function (elem) {
                        return $(elem).closest('.form-group').find(".control-label").text().replace(/\:/, '');
                    },
                    dataFilter: function (data) {
                        if (data.code === 1) {
                            return data.msg ? {"ok": data.msg} : '';
                        } else {
                            return data.msg;
                        }
                    },
                    target: function (input) {
                        var target = $(input).data("target");
                        if (target && $(target).size() > 0) {
                            return $(target);
                        }
                        var $formitem = $(input).closest('.form-group'),
                            $msgbox = $formitem.find('span.msg-box');
                        if (!$msgbox.length) {
                            return [];
                        }
                        return $msgbox;
                    },
                    valid: function (ret) {
                        var that = this, submitBtn = $(".layer-footer [type=submit]", form);
                        that.holdSubmit(true);
                        submitBtn.addClass("disabled");
                        //验证通过提交表单
                        var submitResult = Form.api.submit($(ret), function (data, ret) {
                            that.holdSubmit(false);
                            submitBtn.removeClass("disabled");
                            if (false === $(this).triggerHandler("success.form", [data, ret])) {
                                return false;
                            }
                            if (typeof success === 'function') {
                                if (false === success.call($(this), data, ret)) {
                                    return false;
                                }
                            }
                            //提示及关闭当前窗口
                            var msg = ret.hasOwnProperty("msg") && ret.msg !== "" ? ret.msg : __('Operation completed');
                            parent.Toastr.success(msg);
                            parent.$(".btn-refresh").trigger("click");
                            var index = parent.Layer.getFrameIndex(window.name);
                            parent.Layer.close(index);
                            return false;
                        }, function (data, ret) {
                            that.holdSubmit(false);
                            if (false === $(this).triggerHandler("error.form", [data, ret])) {
                                return false;
                            }
                            submitBtn.removeClass("disabled");
                            if (typeof error === 'function') {
                                if (false === error.call($(this), data, ret)) {
                                    return false;
                                }
                            }
                        }, submit);
                        //如果提交失败则释放锁定
                        if (!submitResult) {
                            that.holdSubmit(false);
                            submitBtn.removeClass("disabled");
                        }
                        return false;
                    }
                }, form.data("validator-options") || {}));

                //移除提交按钮的disabled类
                $(".layer-footer [type=submit],.fixed-footer [type=submit],.normal-footer [type=submit]", form).removeClass("disabled");
                //自定义关闭按钮事件
                form.on("click", ".layer-close", function () {
                    var index = parent.Layer.getFrameIndex(window.name);
                    parent.Layer.close(index);
                    return false;
                });
            },
            selectpicker: function (form) {
                //绑定select元素事件
                if ($(".selectpicker", form).size() > 0) {
                    require(['bootstrap-select', 'bootstrap-select-lang'], function () {
                        $('.selectpicker', form).selectpicker();
                        $(form).on("reset", function () {
                            setTimeout(function () {
                                $('.selectpicker').selectpicker('refresh').trigger("change");
                            }, 1);
                        });
                    });
                }
            },
            selectpage: function (form) {
                //绑定selectpage元素事件
                if ($(".selectpage", form).size() > 0) {
                    require(['selectpage'], function () {
                        $('.selectpage', form).selectPage({
                            eAjaxSuccess: function (data) {
                                data.list = typeof data.rows !== 'undefined' ? data.rows : (typeof data.list !== 'undefined' ? data.list : []);
                                data.totalRow = typeof data.total !== 'undefined' ? data.total : (typeof data.totalRow !== 'undefined' ? data.totalRow : data.list.length);
                                return data;
                            }
                        });
                    });
                    //给隐藏的元素添加上validate验证触发事件
                    $(document).on("change", ".sp_hidden", function () {
                        $(this).trigger("validate");
                    });
                    $(document).on("change", ".sp_input", function () {
                        $(this).closest(".sp_container").find(".sp_hidden").trigger("change");
                    });
                    $(form).on("reset", function () {
                        setTimeout(function () {
                            $('.selectpage', form).selectPageClear();
                        }, 1);
                    });
                }
            },
            cxselect: function (form) {
                //绑定cxselect元素事件
                if ($("[data-toggle='cxselect']", form).size() > 0) {
                    require(['cxselect'], function () {
                        $.cxSelect.defaults.jsonName = 'name';
                        $.cxSelect.defaults.jsonValue = 'value';
                        $.cxSelect.defaults.jsonSpace = 'data';
                        $("[data-toggle='cxselect']", form).cxSelect();
                    });
                }
            },
            citypicker: function (form) {
                //绑定城市远程插件
                if ($("[data-toggle='city-picker']", form).size() > 0) {
                    require(['citypicker'], function () {
                        $(form).on("reset", function () {
                            setTimeout(function () {
                                $("[data-toggle='city-picker']").citypicker('refresh');
                            }, 1);
                        });
                    });
                }
            },
            datetimepicker: function (form) {
                //绑定日期时间元素事件
                if ($(".datetimepicker", form).size() > 0) {
                    require(['bootstrap-datetimepicker'], function () {
                        var options = {
                            format: 'YYYY-MM-DD HH:mm:ss',
                            icons: {
                                time: 'fa fa-clock-o',
                                date: 'fa fa-calendar',
                                up: 'fa fa-chevron-up',
                                down: 'fa fa-chevron-down',
                                previous: 'fa fa-chevron-left',
                                next: 'fa fa-chevron-right',
                                today: 'fa fa-history',
                                clear: 'fa fa-trash',
                                close: 'fa fa-remove'
                            },
                            showTodayButton: true,
                            showClose: true
                        };
                        $('.datetimepicker', form).parent().css('position', 'relative');
                        $('.datetimepicker', form).datetimepicker(options).on('dp.change', function (e) {
                            $(this, document).trigger("changed");
                        });
                    });
                }
            },
            daterangepicker: function (form) {
                //绑定日期时间元素事件
                if ($(".datetimerange", form).size() > 0) {
                    require(['bootstrap-daterangepicker'], function () {
                        var ranges = {};
                        ranges[__('Today')] = [Moment().startOf('day'), Moment().endOf('day')];
                        ranges[__('Yesterday')] = [Moment().subtract(1, 'days').startOf('day'), Moment().subtract(1, 'days').endOf('day')];
                        ranges[__('Last 7 Days')] = [Moment().subtract(6, 'days').startOf('day'), Moment().endOf('day')];
                        ranges[__('Last 30 Days')] = [Moment().subtract(29, 'days').startOf('day'), Moment().endOf('day')];
                        ranges[__('This Month')] = [Moment().startOf('month'), Moment().endOf('month')];
                        ranges[__('Last Month')] = [Moment().subtract(1, 'month').startOf('month'), Moment().subtract(1, 'month').endOf('month')];
                        var options = {
                            timePicker: false,
                            autoUpdateInput: false,
                            timePickerSeconds: true,
                            timePicker24Hour: true,
                            autoApply: true,
                            locale: {
                                format: 'YYYY-MM-DD HH:mm:ss',
                                customRangeLabel: __("Custom Range"),
                                applyLabel: __("Apply"),
                                cancelLabel: __("Clear"),
                            },
                            ranges: ranges,
                        };
                        var origincallback = function (start, end) {
                            $(this.element).val(start.format(this.locale.format) + " - " + end.format(this.locale.format));
                            $(this.element).trigger('blur');
                        };
                        $(".datetimerange", form).each(function () {
                            var callback = typeof $(this).data('callback') == 'function' ? $(this).data('callback') : origincallback;
                            $(this).on('apply.daterangepicker', function (ev, picker) {
                                callback.call(picker, picker.startDate, picker.endDate);
                            });
                            $(this).on('cancel.daterangepicker', function (ev, picker) {
                                $(this).val('').trigger('blur');
                            });
                            $(this).daterangepicker($.extend(true, options, $(this).data()), callback);
                        });
                    });
                }
            },
            /**
             * 绑定上传事件
             * @param form
             * @deprecated Use faupload instead.
             */
            plupload: function (form) {
                Form.events.faupload(form);
            },
            /**
             * 绑定上传事件
             * @param form
             */
            faupload: function (form) {
                //绑定上传元素事件
                if ($(".plupload,.faupload", form).size() > 0) {
                    Upload.api.upload($(".plupload,.faupload", form));
                }
            },
            faselect: function (form) {
                //绑定fachoose选择附件事件
                if ($(".faselect,.fachoose", form).size() > 0) {
                    $(".faselect,.fachoose", form).off('click').on('click', function () {
                        var that = this;
                        var multiple = $(this).data("multiple") ? $(this).data("multiple") : false;
                        var mimetype = $(this).data("mimetype") ? $(this).data("mimetype") : '';
                        var admin_id = $(this).data("admin-id") ? $(this).data("admin-id") : '';
                        var user_id = $(this).data("user-id") ? $(this).data("user-id") : '';
                        var url = $(this).data("url") ? $(this).data("url") : (typeof Backend !== 'undefined' ? "general/attachment/select" : "user/attachment");
                        parent.Fast.api.open(url + "?element_id=" + $(this).attr("id") + "&multiple=" + multiple + "&mimetype=" + mimetype + "&admin_id=" + admin_id + "&user_id=" + user_id, __('Choose'), {
                            callback: function (data) {
                                var button = $("#" + $(that).attr("id"));
                                var maxcount = $(button).data("maxcount");
                                var input_id = $(button).data("input-id") ? $(button).data("input-id") : "";
                                maxcount = typeof maxcount !== "undefined" ? maxcount : 0;
                                if (input_id && data.multiple) {
                                    var urlArr = [];
                                    var inputObj = $("#" + input_id);
                                    var value = $.trim(inputObj.val());
                                    if (value !== "") {
                                        urlArr.push(inputObj.val());
                                    }
                                    urlArr.push(data.url)
                                    var result = urlArr.join(",");
                                    if (maxcount > 0) {
                                        var nums = value === '' ? 0 : value.split(/\,/).length;
                                        var files = data.url !== "" ? data.url.split(/\,/) : [];
                                        var remains = maxcount - nums;
                                        if (files.length > remains) {
                                            Toastr.error(__('You can choose up to %d file%s', remains));
                                            return false;
                                        }
                                    }
                                    inputObj.val(result).trigger("change").trigger("validate");
                                } else {
                                    $("#" + input_id).val(data.url).trigger("change").trigger("validate");
                                }
                            }
                        });
                        return false;
                    });
                }
            },
            fieldlist: function (form) {
                //绑定fieldlist
                if ($(".fieldlist", form).size() > 0) {
                    require(['dragsort', 'template'], function (undefined, Template) {
                        //刷新隐藏textarea的值
                        var refresh = function (name) {
                            var data = {};
                            var textarea = $("textarea[name='" + name + "']", form);
                            var container = $(".fieldlist[data-name='" + name + "']");
                            var template = container.data("template");
                            $.each($("input,select,textarea", container).serializeArray(), function (i, j) {
                                var reg = /\[(\w+)\]\[(\w+)\]$/g;
                                var match = reg.exec(j.name);
                                if (!match)
                                    return true;
                                match[1] = "x" + parseInt(match[1]);
                                if (typeof data[match[1]] == 'undefined') {
                                    data[match[1]] = {};
                                }
                                data[match[1]][match[2]] = j.value;
                            });
                            var result = template ? [] : {};
                            $.each(data, function (i, j) {
                                if (j) {
                                    if (!template) {
                                        if (j.key != '') {
                                            result[j.key] = j.value;
                                        }
                                    } else {
                                        result.push(j);
                                    }
                                }
                            });
                            textarea.val(JSON.stringify(result));
                        };
                        //监听文本框改变事件
                        $(document).on('change keyup changed', ".fieldlist input,.fieldlist textarea,.fieldlist select", function () {
                            refresh($(this).closest(".fieldlist").data("name"));
                        });
                        //追加控制
                        $(".fieldlist", form).on("click", ".btn-append,.append", function (e, row) {
                            var container = $(this).closest(".fieldlist");
                            var tagName = container.data("tag") || (container.is("table") ? "tr" : "dd");
                            var index = container.data("index");
                            var name = container.data("name");
                            var template = container.data("template");
                            var data = container.data();
                            index = index ? parseInt(index) : 0;
                            container.data("index", index + 1);
                            row = row ? row : {};
                            var vars = {index: index, name: name, data: data, row: row};
                            var html = template ? Template(template, vars) : Template.render(Form.config.fieldlisttpl, vars);
                            $(html).attr("fieldlist-item", true).insertBefore($(tagName + ":last", container));
                            $(this).trigger("fa.event.appendfieldlist", $(this).closest(tagName).prev());
                        });
                        //移除控制
                        $(".fieldlist", form).on("click", ".btn-remove", function () {
                            var container = $(this).closest(".fieldlist");
                            var tagName = container.data("tag") || (container.is("table") ? "tr" : "dd");
                            $(this).closest(tagName).remove();
                            refresh(container.data("name"));
                        });
                        //渲染数据&拖拽排序
                        $(".fieldlist", form).each(function () {
                            var container = this;
                            var tagName = $(this).data("tag") || ($(this).is("table") ? "tr" : "dd");
                            $(this).dragsort({
                                itemSelector: tagName,
                                dragSelector: ".btn-dragsort",
                                dragEnd: function () {
                                    refresh($(this).closest(".fieldlist").data("name"));
                                },
                                placeHolderTemplate: $("<" + tagName + "/>")
                            });
                            var textarea = $("textarea[name='" + $(this).data("name") + "']", form);
                            if (textarea.val() == '') {
                                return true;
                            }
                            var template = $(this).data("template");
                            textarea.on("fa.event.refreshfieldlist", function () {
                                $("[fieldlist-item]", container).remove();
                                var json = {};
                                try {
                                    json = JSON.parse($(this).val());
                                } catch (e) {
                                }
                                $.each(json, function (i, j) {
                                    $(".btn-append,.append", container).trigger('click', template ? j : {
                                        key: i, value: j
                                    });
                                });
                            });
                            textarea.trigger("fa.event.refreshfieldlist");
                        });
                    });
                }
            },
            switcher: function (form) {
                form.on("click", "[data-toggle='switcher']", function () {
                    if ($(this).hasClass("disabled")) {
                        return false;
                    }
                    var switcher = $.proxy(function () {
                        var input = $(this).prev("input");
                        input = $(this).data("input-id") ? $("#" + $(this).data("input-id")) : input;
                        if (input.size() > 0) {
                            var yes = $(this).data("yes");
                            var no = $(this).data("no");
                            if (input.val() == yes) {
                                input.val(no);
                                $("i", this).addClass("fa-flip-horizontal text-gray");
                            } else {
                                input.val(yes);
                                $("i", this).removeClass("fa-flip-horizontal text-gray");
                            }
                            input.trigger('change');
                        }
                    }, this);
                    if (typeof $(this).data("confirm") !== 'undefined') {
                        Layer.confirm($(this).data("confirm"), function (index) {
                            switcher();
                            Layer.close(index);
                        });
                    } else {
                        switcher();
                    }

                    return false;
                });
            },
            bindevent: function (form) {

            },
            slider: function (form) {
                if ($(".slider", form).size() > 0) {
                    require(['bootstrap-slider'], function () {
                        $('.slider').removeClass('hidden').css('width', function (index, value) {
                            return $(this).parents('.form-control').width();
                        }).slider().on('slide', function (ev) {
                            var data = $(this).data();
                            if (typeof data.unit !== 'undefined') {
                                $(this).parents('.form-control').siblings('.value').text(ev.value + data.unit);
                            }
                        });
                    });
                }
            },
            bills: function (form){
                console.log(22222);
                //计算小计金额
                $(document).on('input', '.num', function (e) {
                    countPrice(e);
                });

                //计算小计金额
                $(document).on('input', '.price', function (e) {
                    countPrice(e);
                });


                function countPrice(e){
                    var parentDiv = $(e.target).parent().parent().parent().parent();
                    var subtotal = 0.00;
                    var numArray = parentDiv.find('.num');
                    var priceArray = parentDiv.find('.price');
                    $.each(numArray, function (index, item){
                        var number = $(item).val() ? $(item).val(): 0.00,
                            price = parseFloat($(priceArray[index]).val() ? $(priceArray[index]).val() : 0.00);

                        subtotal += number * price;
                    });
                    parentDiv.find('.subtotal').val(subtotal);
                    var total = 0.00;
                    $.each($(document).find('.subtotal'), function (index, item) {
                        total += parseFloat($(item).val());
                    });
                    $(document).find('.total').val(total);
                }
                //添加商品组件
                $(document).on('click', '.add-goods-item-btn',function (){
                    var totalInputElem = $(document).find('#c-total_price');
                    var unitPriceElem = '';
                    var subtotalPriceElem = '';
                    var warehouseElem = "        <div class=\"form-group out-warehouse-id-item\">\n" +
                        "            <label class=\"control-label col-xs-12 col-sm-2\">\n" +
                        "            </label>\n" +
                        "            <div class=\"col-xs-12 col-sm-8\">\n" +
                        "                <div class=\"input-group\">\n" +
                        "                    <span class=\"input-group-addon\">调出仓库</span>\n" +
                        "                    <input data-rule=\"required\" min=\"0\" data-page-size=\"10\" data-pagination=\"true\"\n" +
                        "                           data-source=\"warehouse/index\"\n" +
                        "                           class=\"form-control selectpage c-out_warehouse_id \" disabled name=\"row[out_warehouse_id]["+ goodsKey +"][]\" type=\"text\" value=\"\">\n" +
                        "                </div>\n" +
                        "            </div>\n" +
                        "            <span class=\"msg-box n-right\"></span>\n" +
                        "        </div>" + "        <div class=\"form-group\">\n" +
                        "            <label class=\"control-label col-xs-12 col-sm-2\">\n" +
                        "            </label>\n" +
                        "            <div class=\"col-xs-12 col-sm-8\">\n" +
                        "                <div class=\"input-group\">\n" +
                        "                    <span class=\"input-group-addon\">调入仓库</span>\n" +
                        "                    <input data-rule=\"required\" min=\"0\" data-page-size=\"10\" data-pagination=\"true\"\n" +
                        "                           data-source=\"warehouse/index\"\n" +
                        "                           class=\"form-control selectpage c-in_warehouse_id\" name=\"row[in_warehouse_id]["+ goodsKey +"][]\" type=\"text\" value=\"\">\n" +
                        "                </div>\n" +
                        "            </div>\n" +
                        "            <span class=\"msg-box n-right\"></span>\n" +
                        "        </div>";
                    if (totalInputElem.length){
                        unitPriceElem = "    <div class=\"form-group goods-unit-price-item\">\n" +
                            "        <label class=\"control-label col-xs-12 col-sm-2\">单位价格</label>\n" +
                            "        <div class=\"unit-price-input-group col-xs-12 col-sm-4\">\n" +
                            "        </div>\n" +
                            "\n" +
                            "        <span class=\"msg-box n-right\"></span>\n" +
                            "    </div>\n";
                        subtotalPriceElem = "\n" + "<div class=\"form-group subtotal-group\">\n" +
                            "            <label class=\"control-label col-xs-12 col-sm-2\">金额小计</label>\n" +
                            "            <div class=\"col-xs-12 col-sm-8\">\n" +
                            "                <input readonly data-rule=\"required\" class=\"form-control subtotal\"\n" +
                            "                       name=\"row[subtotal_price]["+ goodsKey +"]\" type=\"number\" value=\"0.00\">\n" +
                            "            </div>\n" +
                            "        </div>";
                        warehouseElem ="        <div class=\"form-group\">\n" +
                            "            <label class=\"control-label col-xs-12 col-sm-2\">\n" +
                            "            </label>\n" +
                            "            <div class=\"col-xs-12 col-sm-8\">\n" +
                            "                <div class=\"input-group\">\n" +
                            "                    <span class=\"input-group-addon\">仓库</span>\n" +
                            "                    <input data-rule=\"required\" min=\"0\" data-page-size=\"10\" data-pagination=\"true\"\n" +
                            "                           data-source=\"warehouse/index\"\n" +
                            "                           class=\"form-control selectpage c-warehouse_id\" name=\"row[warehouse_id]["+ goodsKey +"][]\" type=\"text\" value=\"\">\n" +
                            "                </div>\n" +
                            "            </div>\n" +
                            "            <span class=\"msg-box n-right\"></span>\n" +
                            "        </div>";
                    }
                    $(this).parent().parent().before(
                        "<div>" +
                        "<div class=\"form-group goods-item\">\n" +
                        "            <label class=\"control-label col-xs-12 col-sm-2\">\n" +
                        "                <i style=\"font-size: 16px;\" class=\"fa fa-times-circle delete-goods-bth\"></i>\n" +
                        "            </label>\n" +
                        "            <div class=\"col-xs-12 col-sm-8\">\n" +
                        "                <div class=\"input-group\">\n" +
                        "                    <span class=\"input-group-addon\">商品</span>\n" +
                        "                    <input data-format-item=\"{name}┃{category_id}\" data-rule=\"required\" min=\"0\"\n" +
                        "                           data-page-size=\"10\" data-pagination=\"true\"\n" +
                        "                           data-source=\"goods/goods/index\"\n" +
                        "                           class=\"form-control selectpage c-goods_id\" name=\"row[goods_id]["+ goodsKey +"][]\" type=\"text\" value=\"\">\n" +
                        "                </div>\n" +
                        "            </div>\n" +
                        "            <span class=\"msg-box n-right\"></span>\n" +
                        "        </div>\n" +
                        "\n" + warehouseElem +
                        unitPriceElem +
                        "    <div class=\"form-group goods-unit-num-item\">\n" +
                        "        <label class=\"control-label col-xs-12 col-sm-2\">数量</label>\n" +
                        "        <div class=\"unit-num-input-group col-xs-12 col-sm-4\">\n" +
                        "\n" +
                        "        </div>\n" +
                        "        <span class=\"msg-box n-right\"></span>\n" +
                        "    </div>\n" +
                        subtotalPriceElem +
                        "    <div class=\"form-group dashed-line\">\n" +
                        "        <div style=\"border-top: 2px dashed gray\"></div>\n" +
                        "    </div></div>"
                    );
                    require(['selectpage'], function () {
                        $('.selectpage', form).selectPage({
                            eAjaxSuccess: function (data) {
                                data.list = typeof data.rows !== 'undefined' ? data.rows : (typeof data.list !== 'undefined' ? data.list : []);
                                data.totalRow = typeof data.total !== 'undefined' ? data.total : (typeof data.totalRow !== 'undefined' ? data.totalRow : data.list.length);
                                return data;
                            }
                        });
                    });
                    goodsSelectPageEvent();
                    goodsKey++;
                });



                $(document).on('click',".delete-goods-bth",function () {
                    $(this).parent().parent().parent().remove();
                });
                function goodsSelectPageEvent() {
                    $(".c-goods_id").data("eSelect", function(data, elem){
                        console.log(111);
                        var goodsItem = elem.elem.combo_input.parents('div.form-group.goods-item');
                        goodsItem.siblings('.show-unit-info').remove();
                        goodsItem.parent().find('.c-out_warehouse_id').selectPageDisabled(false);
                        goodsItem.after("<div class=\"form-group goods-item show-unit-info\">\n" +
                            "            <label class=\"control-label col-xs-12 col-sm-2\">\n" +
                            "            商品规格</label>\n" +
                            "            <div class=\"col-xs-12 col-sm-8\">\n" +
                            "<input readonly class=\"form-control\" value=\""+ data['unit_info']['unit_info'] +"\" type=\"text\">" +
                            "            </div>\n" +
                            "            <span class=\"msg-box n-right\"></span>\n" +
                            "        </div>");
                        //如果存在商家商品价格数据
                        if (data['goods_merchant'] !== undefined && data['goods_merchant'].length !== 0){
                            billUnitInfo(data['goods_merchant'], goodsItem);
                        }else{
                            billUnitInfo(data['unit_info'], goodsItem);
                        }

                        function billUnitInfo(unitInfo, elem){
                            var parentDiv = elem.parent();
                            var unitPrice = elem.nextAll('.goods-unit-price-item');
                            var unitNum = parentDiv.children('.goods-unit-num-item');
                            unitPrice.children('.unit-price-input-group').empty();
                            unitNum.children('.unit-num-input-group').empty();
                            $(".unit-info", parentDiv).remove();//先清空先前的规格单位价格元素
                            parentDiv.children('.dashed-line').before(
                                "<input name='row[unit_info][" + unitKey +"]' class='hidden' value='"+ JSON.stringify(unitInfo) +"'>"
                            );


                            $.each(unitInfo.unit_name, function (index, value){
                                if (index === 0){
                                    if (unitPrice.length){
                                        unitPrice.children('.unit-price-input-group').append(
                                            "<div class=\"input-group\"><input " +
                                            "data-rule=\"required\" autocomplete='off' class=\"form-control price\" name=\"row[unit_price]["+ unitKey +"][]\" type=\"text\" value='" +  unitInfo.unit_price[index] +"'>\n" +
                                            "                    <div class=\"input-group-addon\">\n" +
                                            "                        元/\n" + value +
                                            "                    </div></div>"
                                        );
                                    }
                                    unitNum.children('.unit-num-input-group').append(
                                        "<div class=\"input-group\"><input " +
                                        "data-rule=\"required\" autocomplete='off' class=\"form-control num\" name=\"row[bill_num]["+ unitKey +"][]\" type=\"text\" value=''>\n" +
                                        "                    <div class=\"input-group-addon\">\n" +
                                        "                        \n" + value +
                                        "                    </div></div>"
                                    );
                                }else{
                                    if (index !== 1){
                                        unitNum = unitNum.next();
                                        unitPrice = unitPrice.next();
                                    }
                                    if (unitPrice.length){
                                        unitPrice.after(
                                            "<div class=\"form-group unit-info\"><label class=\"control-label col-xs-12 col-sm-2\"></label>" +
                                            "<div class=\"unit-info col-xs-12 col-sm-4\"><div class=\"input-group\"><input " +
                                            "data-rule=\"required\" autocomplete='off' class=\"form-control price\" name=\"row[unit_price]["+ unitKey +"][]\" type=\"text\" value='" + unitInfo.unit_price[index] +"'>\n" +
                                            "                    <div class=\"input-group-addon\">\n" +
                                            "                        元/\n" + value +
                                            "                    </div></div></div><span class=\"msg-box n-right\"></span></div>"
                                        );
                                    }
                                    /*parentDiv.children('.subtotal-group').before(
                                        "<div class=\"form-group unit-info\"><label class=\"control-label col-xs-12 col-sm-2\"></label>" +
                                        "<div class=\"unit-info col-xs-12 col-sm-4\"><div class=\"input-group\"><input " +
                                        "data-rule=\"required\" autocomplete='off' class=\"form-control num\" name=\"row[bill_num]["+ unitKey +"][]\" type=\"text\" value=''>\n" +
                                        "                    <div class=\"input-group-addon\">\n" +
                                        "                        \n" + value +
                                        "                    </div></div></div><span class=\"msg-box n-right\"></span></div>"
                                    );*/
                                    unitNum.after(
                                        "<div class=\"form-group unit-info\"><label class=\"control-label col-xs-12 col-sm-2\"></label>" +
                                        "<div class=\"unit-info col-xs-12 col-sm-4\"><div class=\"input-group\"><input " +
                                        "data-rule=\"required\" autocomplete='off' class=\"form-control num\" name=\"row[bill_num]["+ unitKey +"][]\" type=\"text\" value=''>\n" +
                                        "                    <div class=\"input-group-addon\">\n" +
                                        "                        \n" + value +
                                        "                    </div></div></div><span class=\"msg-box n-right\"></span></div>"
                                    );
                                }
                            });
                            unitKey++;
                        }
                    }).data("params", function (obj) {
                        return {
                            custom: {
                                merchant_id: $("#c-merchant_id").val(),
                                type: $("#c-type").val()
                            }
                        };
                    });
                    $('.c-out_warehouse_id').data('eSelect', function (data, elem){
                        var outWarehouseItem = elem.elem.combo_input.parents('div.form-group.out-warehouse-id-item');
                        outWarehouseItem.siblings('.show-stock-info').remove();
                        outWarehouseItem.after("<div class=\"form-group goods-item show-stock-info\">\n" +
                            "            <label class=\"control-label col-xs-12 col-sm-2\">\n" +
                            "            当前库存</label>\n" +
                            "            <div class=\"col-xs-12 col-sm-8\">\n" +
                            "<input readonly class=\"form-control\" value=\""+ data['stock'] +"\" type=\"text\">" +
                            "            </div>\n" +
                            "            <span class=\"msg-box n-right\"></span>\n" +
                            "        </div>");
                    }).data('params', function(obj){
                        var goodsId = $(obj.elem.combo_input).parents('.form-group').siblings('.goods-item').find('input.sp_hidden').val();
                        if (goodsId){
                            return {
                                custom:{
                                    goods_id: goodsId,
                                    check_goods_id: true,
                                }
                            };
                        }
                    });
                    $('.c-warehouse_id').data('params', function(obj){
                        if ($("#c-type").val() === '2'){
                            var goodsId = $(obj.elem.combo_input).parents('.form-group').siblings('.goods-item').find('input.sp_hidden').val();
                            return {
                                custom:{
                                    goods_id: goodsId
                                }
                            };
                        }
                    });
                }
                goodsSelectPageEvent();
            },
            unit: function (form) {
                var unitInfoInput = $("#c-unit_info", form);//规格单位输入框元素
                /**
                 * 创建规格单位价格输入框
                 */
                function addUnitPriceElement(unit_info) {
                    var unitNum = []; //规格单位的进制数字
                    var unitInfo = unitInfoInput.val().split("="), //商品规格输入框参数数组
                        unitNameArray = []; //商品规格名称数组
                    $("#placeholder", form).hide();//隐藏 请先填写商品规格
                    $(".unit-info", form).remove();//先清空先前的规格单位价格元素
                    //规格数组长度大于0        空字符串在数组中会使数组长度为1
                    if (unitInfo.length > 0 && unitInfo[0] !== '' && unitInfo[0].replace(/[0-9]/ig, "") !== '' && !isNaN(parseInt(unitInfo[0]))) {
                        //排序循环 数组大单位到小单位排序 并取出单位转换进制数量 与 单位名称
                        for (var key = 0; key < unitInfo.length; key++) {

                            /*每轮循环出最小的*/
                            for (var s = key + 1; s < unitInfo.length; s++) {

                                if (parseInt(unitInfo[s]) < parseInt(unitInfo[key])) {
                                    var temp = '';
                                    temp = unitInfo[s];
                                    unitInfo[s] = unitInfo[key];
                                    unitInfo[key] = temp;
                                }
                            }
                            unitNameArray[key] = unitInfo[key].replace(/[0-9]/ig, ""); // 分解剥离出商品规格的单位名称
                            unitNum[key] = parseInt(unitInfo[key]);
                            if (unitNameArray[key] === '' || isNaN(unitNum[key])){
                                break;
                            }
                            if (key === 0){
                                unitInfoInput.parent().parent().next().children('.unit-price-input-group').append(
                                    "<div class=\"unit-info input-group\"><input id=\"c-unit_price " + key +
                                    "\" data-rule=\"required\" class=\"form-control\" name=\"row[unit_price][" + key + "]\" type=\"text\" value='" + (unit_info !== undefined ? unit_info.unit_price[key] : '') + "'>\n" +
                                    "                    <div class=\"input-group-addon\">\n" +
                                    "                        元/\n" + unitNameArray[key] +
                                    "                    </div></div>"
                                );
                            }else{
                                unitInfoInput.parent().parent().parent().children(':last-child').prev().after(
                                    "<div class=\"form-group unit-info\"><label class=\"control-label col-xs-12 col-sm-2\"></label>" +
                                    "<div class=\"unit-info col-xs-12 col-sm-4\"><div class=\"input-group\"><input id=\"c-unit_price " + key +
                                    "\" data-rule=\"required\" class=\"form-control\" name=\"row[unit_price][" + key + "]\" type=\"text\" value='" + (unit_info !== undefined ? unit_info.unit_price[key] : '') +"'>\n" +
                                    "                    <div class=\"input-group-addon\">\n" +
                                    "                        元/\n" + unitNameArray[key] +
                                    "                    </div></div></div><span id=\"warningMsg\" class=\"msg-box n-right\"></span></div>");
                            }
                            /*$("#warningMsg", form).before(
                                "<div style='padding-left: 0;' class=\"unit-info col-xs-4\"><div class=\"input-group\"><input id=\"c-unit_price " + key +
                                "\" data-rule=\"required\" class=\"form-control\" name=\"row[unit_price][" + key + "]\" type=\"text\" value='" + (unit_info !== undefined ? unit_info.unit_price[key] : '') +"'>\n" +
                                "                    <div class=\"input-group-addon\">\n" +
                                "                        元/\n" + unitNameArray[key] +
                                "                    </div></div></div>"
                            );*/
                            //隐藏的规格单位名称 会提交上去
                            $("#warningMsg", form).before(
                                "<input hidden class=\"hidden form-control unit-info\" name=\"row[unit_name][" + key + "]\" type=\"text\" value=" + unitNameArray[key] + ">" +
                                "<input hidden class=\"hidden form-control unit-info\" name=\"row[unit_num][" + key + "]\" type=\"text\" value=" + unitNum[key] + ">"
                            );
                        }
                    }else{
                        $("#placeholder", form).show();

                    }
                }
                if (unitInfoInput.size() > 0) {
                    if (unit_info !== {}){
                        addUnitPriceElement(unit_info);
                    }
                }
                unitInfoInput.on('input',function () {
                    addUnitPriceElement();
                });


            }
        },
        api: {
            submit: function (form, success, error, submit) {
                if (form.size() === 0) {
                    Toastr.error("表单未初始化完成,无法提交");
                    return false;
                }
                if (typeof submit === 'function') {
                    if (false === submit.call(form, success, error)) {
                        return false;
                    }
                }
                var type = form.attr("method") ? form.attr("method").toUpperCase() : 'GET';
                type = type && (type === 'GET' || type === 'POST') ? type : 'GET';
                url = form.attr("action");
                url = url ? url : location.href;
                //修复当存在多选项元素时提交的BUG
                var params = {};
                var multipleList = $("[name$='[]']", form);
                if (multipleList.size() > 0) {
                    var postFields = form.serializeArray().map(function (obj) {
                        return $(obj).prop("name");
                    });
                    $.each(multipleList, function (i, j) {
                        if (postFields.indexOf($(this).prop("name")) < 0) {
                            params[$(this).prop("name")] = '';
                        }
                    });
                }
                //调用Ajax请求方法
                Fast.api.ajax({
                    type: type,
                    url: url,
                    data: form.serialize() + (Object.keys(params).length > 0 ? '&' + $.param(params) : ''),
                    dataType: 'json',
                    complete: function (xhr) {
                        var token = xhr.getResponseHeader('__token__');
                        if (token) {
                            $("input[name='__token__']").val(token);
                        }
                    }
                }, function (data, ret) {
                    $('.form-group', form).removeClass('has-feedback has-success has-error');
                    if (data && typeof data === 'object') {
                        //刷新客户端token
                        if (typeof data.token !== 'undefined') {
                            $("input[name='__token__']").val(data.token);
                        }
                        //调用客户端事件
                        if (typeof data.callback !== 'undefined' && typeof data.callback === 'function') {
                            data.callback.call(form, data);
                        }
                    }
                    if (typeof success === 'function') {
                        if (false === success.call(form, data, ret)) {
                            return false;
                        }
                    }
                }, function (data, ret) {
                    if (data && typeof data === 'object' && typeof data.token !== 'undefined') {
                        $("input[name='__token__']").val(data.token);
                    }
                    if (typeof error === 'function') {
                        if (false === error.call(form, data, ret)) {
                            return false;
                        }
                    }
                });
                return true;
            },
            bindevent: function (form, success, error, submit) {

                form = typeof form === 'object' ? form : $(form);

                var events = Form.events;

                events.bindevent(form);

                events.validator(form, success, error, submit);

                events.selectpicker(form);

                events.daterangepicker(form);

                events.selectpage(form);

                events.cxselect(form);

                events.citypicker(form);

                events.datetimepicker(form);

                events.faupload(form);

                events.faselect(form);

                events.fieldlist(form);

                events.slider(form);

                events.switcher(form);

                events.unit(form);

                events.bills(form);
            },
            custom: {}
        },
    };
    return Form;
});
