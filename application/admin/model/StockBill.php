<?php

namespace app\admin\model;

use think\Model;
use traits\model\SoftDelete;

class StockBill extends Model
{

    use SoftDelete;

    

    // 表名
    protected $name = 'stock_bill';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = false;
    protected $deleteTime = 'deletetime';

    // 追加属性
    protected $append = [

    ];
    

    







    public function stockbillextend()
    {
        return $this->hasOne('StockBillExtend', 'stock_bill_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }


    public function admin()
    {
        return $this->belongsTo('Admin', 'admin_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }
}
