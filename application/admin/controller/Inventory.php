<?php

namespace app\admin\controller;

use app\common\controller\Backend;
use think\Db;
use Exception;
use think\exception\PDOException;
use think\exception\ValidateException;

/**
 * 库存盘点管理
 *
 * @icon fa fa-circle-o
 */
class Inventory extends Backend
{
    
    /**
     * Inventory模型对象
     * @var \app\admin\model\Inventory
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Inventory;
        $this->view->assign("typeList", $this->model->getTypeList());
    }

    public function import()
    {
        parent::import();
    }
    protected $dataLimit = true;
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
                    ->with(['admin','goods','warehouse'])
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
                $row->getRelation('admin')->visible(['id','username','nickname']);
				$row->getRelation('goods')->visible(['id','name','category_id','unit_info']);
				$row->getRelation('warehouse')->visible(['id','name']);
                $unitArray = json_decode($row->unit_info, true);
                $inputNumString = inputNumToString($unitArray['unit_name'], $unitArray['input_num']);
                $row->input_num = $inputNumString;
                $row->unit = $unitArray['unit_info'];
                $row->num = $row->num . $unitArray['unit_name'][count($unitArray['unit_name']) - 1];
            }

            $result = array("total" => $list->total(), "rows" => $list->items());

            return json($result);
        }
        return $this->view->fetch();
    }

    public function add($ids = null)
    {
        $stockModel = new \app\admin\model\GoodsStock();
        $row = $stockModel->with(['goods', 'warehouse'])->find($ids);
        $unitInfo = json_decode($row['unit_info'], true);
        if ($this->request->isPost()) {
            $params = $this->request->post("row/a");
            if ($params){
                $num = inputStockInfoToMinStock($params['stock_num'], $unitInfo['unit_num']);
                Db::startTrans();
                try {
                    if ($params['type'] == 2){
                        $currentStock = $row['stock'];
                        if ($currentStock < $num){
                            $this->error('第');
                        }else{
                            //库存自减
                            $row->stock = $row->stock - $num;
                            $result = $row->save();
                        }
                    }else{
                        //库存自增
                        if ($row){
                            $row->stock = $row->stock + $num;
                            $result = $row->save();
                        }else{
                            $this->error('不存此商品库存');
                        }
                    }
                    $unitInfo['input_num'] = $params['stock_num'];
                    $inventoryResult = $this->model->data([
                        'goods_id' => $row['goods_id'],
                        'warehouse_id' => $row['warehouse_id'],
                        'admin_id' => $this->auth->id,
                        'num' => $num,
                        'type' => $params['type'],
                        'unit_info' => json_encode($unitInfo, JSON_UNESCAPED_UNICODE),
                    ])->save();
                    if (!$result || !$inventoryResult){
                        $this->error('库存盘点失败，这是未知错误！');
                    }
                    Db::commit();
                } catch (Exception $e) {
                    Db::rollback();
                    $this->error($e->getMessage());
                }
                $this->success();
            }
            $this->error(__('Parameter %s can not be empty', ''));
        }

        if (!$row) {
            $this->error(__('No Results were found'));
        }
        $categoryId = $row['goods']['category_id'];
        $categoryModel = new \app\admin\model\Category();
        $category = $categoryModel->where('id', $categoryId)->field('id, name')->find()->toArray();

        $returnData = [
            'name' => $row['goods']['name'],
            'category_name' => $category['name'],
            'warehouse_name' => $row['warehouse']['name'],
            'unit_info' => $unitInfo['unit_info'],
            'unit_name' => $unitInfo['unit_name'],
            'unit_num' => $unitInfo['unit_num'],
            'stock' => stockToString($unitInfo, $row['stock'])
        ];
        $this->view->assign('row', $returnData);
        return $this->view->fetch();
    }

}
