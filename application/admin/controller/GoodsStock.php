<?php

namespace app\admin\controller;

use app\common\controller\Backend;

/**
 * 库存管理
 *
 * @icon fa fa-circle-o
 */
class GoodsStock extends Backend
{
    
    /**
     * GoodsStock模型对象
     * @var \app\admin\model\GoodsStock
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\GoodsStock;

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
    

    /**
     * 查看
     */
    public function index()
    {
        //当前是否为关联查询
        $this->relationSearch = true;
        //设置过滤方法
        $this->request->filter(['strip_tags', 'trim']);
        if ($this->request->isAjax()) {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('keyField')) {
                return $this->selectpage();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();

            $list = $this->model
                    ->with(['goods','warehouse'])
                    ->where($where)
                    ->order($sort, $order)
                    ->paginate($limit);
            $data = $list->toArray();
            $categoryIds = array_unique(array_column(array_column($data['data'], 'goods'), 'category_id'));
            $categoryModel = new \app\admin\model\Category();
            $category = $categoryModel->whereIn('id', $categoryIds)->field('id, name')->select()->toArray();
            $categoryIdKey = array_column($category, null, 'id');
            foreach ($list as $row) {
                $row->category_name = $categoryIdKey[$row->goods->category_id]['name'];
                $row->getRelation('goods')->visible(['name','category_id']);
				$row->getRelation('warehouse')->visible(['name','remarks']);
                $unitInfo = json_decode($row->unit_info, true);
                $row->unit_info = $unitInfo['unit_info'];
                $row->stock = stockToString($unitInfo, $row->stock);
            }

            $result = array("total" => $list->total(), "rows" => $list->items());

            return json($result);
        }
        return $this->view->fetch();
    }

}
