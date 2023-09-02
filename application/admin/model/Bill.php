<?php

namespace app\admin\model;

use think\Model;
use traits\model\SoftDelete;

class Bill extends Model
{

    use SoftDelete;

    

    // 表名
    protected $name = 'bill';
    
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = false;
    protected $deleteTime = 'deletetime';

    // 追加属性
    protected $append = [
        'type_text'
    ];
    

    
    public function getTypeList()
    {
        return ['1' => __('Type 1'), '2' => __('Type 2')];
    }

    public function getTypeTextAttr($value, $data)
    {
        $value = $value ? $value : (isset($data['type']) ? $data['type'] : '');
        $list = $this->getTypeList();
        return isset($list[$value]) ? $list[$value] : '';
    }

    public function merchant()
    {
        return $this->belongsTo('Merchant', 'merchant_id', 'id');
    }


    public function admin()
    {
        return $this->belongsTo('Admin', 'admin_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }


    public function billextend()
    {
        return $this->hasMany('BillExtend', 'bill_id', 'id');
    }
}
