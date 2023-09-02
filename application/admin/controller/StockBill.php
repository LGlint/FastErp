<?php

namespace app\admin\controller;

use app\admin\model\StockBillExtend;
use app\common\controller\Backend;
use Exception;
use think\Db;
use think\exception\PDOException;
use think\exception\ValidateException;

/**
 * 库存操作管理
 *
 * @icon fa fa-circle-o
 */
class StockBill extends Backend
{
    
    /**
     * StockBill模型对象
     * @var \app\admin\model\StockBill
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\StockBill;

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
                    ->with(['admin'])
                    ->where($where)
                    ->order($sort, $order)
                    ->paginate($limit);

            foreach ($list as $row) {
                
//                $row->getRelation('stockbillextend')->visible(['id','stock_bill_id','out_warehouse_id','in_warehouse_id','goods_id','unit_info','num']);
				$row->getRelation('admin')->visible(['id','username','nickname']);
            }

            $result = array("total" => $list->total(), "rows" => $list->items());

            return json($result);
        }
        return $this->view->fetch();
    }

    public function detail($ids)
    {
        if ($this->request->isAjax()){
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();

            $billExt = new StockBillExtend();
            $list = $billExt->with(['goods', 'outWarehouse', 'inWarehouse', 'stockBill'])->where('stock_bill_id', $ids)->paginate($limit);
            foreach ($list as $row){
                $row->getRelation('goods')->visible(['name']);
                $row->getRelation('out_warehouse')->visible(['name']);
                $row->getRelation('in_warehouse')->visible(['name']);
                $row->getRelation('stock_bill')->visible(['bill_num']);
                $unitArray = json_decode($row->unit_info, true);
                $row->num = $row->num . $unitArray['unit_name'][count($unitArray['unit_name']) - 1];
                $inputNumString = inputNumToString($unitArray['unit_name'], $unitArray['input_num']);
                $row->input_num = $inputNumString;
                $row->unit = $unitArray['unit_info'];
            }
            $result = array('total' => $list->total(), 'rows' => $list->items());

            return json($result);
        }
        $this->view->assign("id", $ids);
        return $this->view->fetch();
    }

    public function add()
    {
        if ($this->request->isPost()) {
            $params = $this->request->post("row/a");
            if ($params) {
                //处理好调拨单的数据
                $unitInfoJsonArray = $params['unit_info'];
                $billNum = 'DB' . date('YmdHis');
                $adminId = $this->auth->id;
                $billExt = [];
                Db::startTrans();
                try {
                    $billResult = $this->model->data([
                        'bill_num' => $billNum,
                        'admin_id' => $adminId
                    ])->save();
                    $goodsStock = new \app\admin\model\GoodsStock();
                    foreach ($unitInfoJsonArray as $key => &$value) {
                        $value = json_decode($value, true);
                        $goodsId = $params['goods_id'][$key][1];
                        $outWarehouse = $params['out_warehouse_id'][$key][1];
                        $inWarehouse = $params['in_warehouse_id'][$key][1];
                        $num = inputStockInfoToMinStock($params['bill_num'][$key], $value['unit_num']);
                        $stockUnitInfo = [
                            'unit_info' => $value['unit_info'],
                            'unit_name' => $value['unit_name'],
                            'unit_num' => $value['unit_num']
                        ];

                        $currenStock = $goodsStock->where('goods_id', $goodsId)
                            ->where('warehouse_id', $outWarehouse)
                            ->where('stock', '>', 0)
                            ->field('stock')->find();
                        if ($currenStock['stock'] < $num) {
                            throw new Exception('第 ' . ($key + 1) . ' 个商品 [' . $params['goods_id'][$key][0] . '] 库存不足');
                        } else {
                            $currenStock->stock = $currenStock->stock - $num;
                            $outStockResult = $currenStock->save();
                        }
                        $inStock = $goodsStock->where('goods_id', $goodsId)->where('warehouse_id', $inWarehouse)->field('stock')->find();
                        if ($inStock) {
                            $inStock->stock = $inStock->stock + $num;
                            $inStockResult = $inStock->save();
                        } else {
                            $inStockResult = $goodsStock->data([
                                'goods_id' => $goodsId,
                                'warehouse_id' => $inWarehouse,
                                'unit_info' => json_encode($stockUnitInfo, JSON_UNESCAPED_UNICODE),
                                'stock' => $num,
                            ])->save();
                        }
                        $value['input_num'] = $params['bill_num'][$key];
                        $billExt[$key]['num'] = $num;
                        $billExt[$key]['goods_id'] = $goodsId;
                        $billExt[$key]['out_warehouse_id'] = $outWarehouse;
                        $billExt[$key]['in_warehouse_id'] = $inWarehouse;
                        $billExt[$key]['stock_bill_id'] = $this->model->id;
                        $billExt[$key]['unit_info'] = json_encode($value, JSON_UNESCAPED_UNICODE);
                    }
                    $stockBillExtModel = new StockBillExtend();
                    $stockBillResult = $stockBillExtModel->saveAll($billExt);
                    if (!$billResult || empty($outStockResult) || empty($inStockResult) || empty($stockBillResult)){
                        throw new Exception('生成账单失败，这是未知错误！');
                    }
                    Db::commit();
                } catch (ValidateException | PDOException | Exception | \think\Exception $e) {
                    Db::rollback();
                    $this->error($e->getMessage());
                }
                $this->success();
            }
            $this->error(__('Parameter %s can not be empty', ''));
        }
        return $this->view->fetch();
    }
}
