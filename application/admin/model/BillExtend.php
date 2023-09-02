<?php

namespace app\admin\model;

use think\Model;

class BillExtend extends Model
{
    // 表名
    protected $name = 'bill_extend';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = false;

    public function bill()
    {
        return $this->belongsTo(Bill::class, 'bill_id', 'id');
    }

    public function goods()
    {
        return $this->belongsTo(\app\admin\model\goods\Goods::class, 'goods_id', 'id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'id');
    }
}
