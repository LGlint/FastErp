<?php

namespace app\admin\controller;

use app\admin\model\GoodsStock;
use app\common\controller\Backend;
use think\db\Query;
use think\Model;

/**
 * 仓库管理
 *
 * @icon fa fa-circle-o
 */
class Warehouse extends Backend
{
    
    /**
     * Warehouse模型对象
     * @var \app\admin\model\Warehouse
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Warehouse;

    }

    public function import()
    {
        parent::import();
    }

    /**
     * 默认生成的控制器所继承的父类中有index/add/edit/del/multi五个基础方法、destroy/restore/recyclebin三个回收站方法
     * 因此在当前控制器中可不用编写增删改查的代码,除非需要自己控制这部分逻辑
     * 需要将application/admin/library/traits/Backend.php中对应的方法复制到当前控制器,然后进行修改
     */
    
    public function selectpage()
    {
        //设置过滤方法
        $this->request->filter(['trim', 'strip_tags', 'htmlspecialchars']);
        //当前页
        $page = $this->request->request("pageNumber");
        //分页大小
        $pagesize = $this->request->request("pageSize");
        //自定义搜索条件
        $custom = (array)$this->request->request("custom/a");
        //搜索关键词,客户端输入以空格分开,这里接收为数组
        $word = (array)$this->request->request("q_word/a");

        $result = [];
        $warehouseId = [];
        if (!empty($custom['goods_id'])) {
            $goodsId = $custom['goods_id'];
            $goodsStockModel = new GoodsStock();
            $result = $goodsStockModel->where('goods_id', $goodsId)
                ->where('stock', '>', 0)
                ->field('id,goods_id,warehouse_id,stock,unit_info')
                ->select()->toArray();
            $warehouseId = array_unique(array_column($result, 'warehouse_id'));
            if (empty($warehouseId)){
                return json(['list' => [], 'total' => 0]);
            }
        }

        $where = function (Query $query) use ($word, $warehouseId){
            $word = array_filter(array_unique($word));
            if (count($word) == 1) {
                $query->where('name', "like", "%" . reset($word) . "%");
            } else {
                $query->where(function ($query) use ($word) {
                    foreach ($word as $index => $item) {
                        $query->whereOr(function ($query) use ($item) {
                            $query->where('name', "like", "%{$item}%");
                        });
                    }
                });
            }
            if (!empty($warehouseId)){
                $query->whereIn('id', $warehouseId);
            }
        };

        $this->model->where($where);


        $total = $this->model->count();
        if ($total <= 0){
            return json(['list' => [], 'total' => 0]);
        }
        $this->model->field('id,name');
        $list = $this->model
            ->where($where)
            ->page($page, $pagesize)
            ->select()->toArray();
        if (!empty($result)){
            $result = array_column($result, null, 'warehouse_id');
            foreach ($list as &$value){
                $unitInfo = json_decode($result[$value['id']]['unit_info'], true);
                $value['stock'] = stockToString($unitInfo, $result[$value['id']]['stock']);
            }
        }
        return json(['list' => $list, 'total' => $total]);
    }
}
