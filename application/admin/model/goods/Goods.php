<?php

namespace app\admin\model\goods;

use app\admin\model\Category;
use app\admin\model\GoodsMerchant;
use think\Model;
use traits\model\SoftDelete;

class Goods extends Model
{

    use SoftDelete;

    

    // 表名
    protected $name = 'goods';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    protected $deleteTime = 'deletetime';

    // 追加属性
    protected $append = [

    ];
    

    







    /*public function admin()
    {
        return $this->belongsTo('app\admin\model\Admin', 'admin_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }*/


    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }

    public function goodsMerchant()
    {
        return $this->hasMany(GoodsMerchant::class,'goods_id', 'id');
    }
}
