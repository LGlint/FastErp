<?php

namespace app\admin\model;

use think\Model;

class StockBillExtend extends Model
{
    // 表名
    protected $name = 'stock_bill_extend';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = false;

    public function stockBill()
    {
        return $this->belongsTo(StockBill::class, 'stock_bill_id', 'id');
    }

    public function goods()
    {
        return $this->belongsTo(\app\admin\model\goods\Goods::class, 'goods_id', 'id');
    }

    public function outWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'out_warehouse_id', 'id');
    }

    public function inWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'in_warehouse_id', 'id');
    }
}
