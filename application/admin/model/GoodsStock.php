<?php

namespace app\admin\model;

use think\Model;
use traits\model\SoftDelete;

class GoodsStock extends Model
{

    use SoftDelete;

    

    // 表名
    protected $name = 'goods_stock';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = 'deletetime';

    // 追加属性
    protected $append = [

    ];
    

    







    public function goods()
    {
        return $this->belongsTo('Goods', 'goods_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }


    public function warehouse()
    {
        return $this->belongsTo('Warehouse', 'warehouse_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }
}
