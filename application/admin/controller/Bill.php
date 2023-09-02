<?php

namespace app\admin\controller;

use app\admin\model\BillExtend;
use app\common\controller\Backend;
use Exception;
use think\Db;
use think\exception\PDOException;
use think\exception\ValidateException;

/**
 * 账单管理
 *
 * @icon fa fa-circle-o
 */
class Bill extends Backend
{
    
    /**
     * Bill模型对象
     * @var \app\admin\model\Bill
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Bill;
        $this->view->assign("typeList", $this->model->getTypeList());
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
                    ->with(['admin','merchant'])
                    ->where($where)
                    ->order($sort, $order)
                    ->paginate($limit);
            foreach ($list as $row) {
                $row->total_price = bcdiv($row->total_price, 100, 2);
                $row->getRelation('admin')->visible(['nickname']);
                $row->getRelation('merchant')->visible(['name']);
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

            $billExt = new BillExtend();
            $list = $billExt->with(['goods', 'warehouse', 'bill'])->where('bill_id', $ids)->paginate($limit);
            foreach ($list as $row){
                $row->getRelation('goods')->visible(['name']);
                $row->getRelation('warehouse')->visible(['name']);
                $row->getRelation('bill')->visible(['bill_num']);
                $unitArray = json_decode($row->unit_info, true);
                $row->num = $row->num . $unitArray['unit_name'][count($unitArray['unit_name']) - 1];
                $inputNumString = inputNumToString($unitArray['unit_name'], $unitArray['input_num']);
                /*$inputNumString = '';
                foreach ($unitArray['unit_name'] as $key => $value){
                    $inputNumString .= $unitArray['input_num'][$key] . $value;
                }*/
                $row->input_num = $inputNumString;
                $row->unit = $unitArray['unit_info'];
                $row->subtotal = bcdiv($row->subtotal, 100, 2);
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
            $adminId = $this->auth->id;
            if ($params) {
                //接收参数， 保存数据
                $type = $params['type'];
                $merchantId = $params['merchant_id'];
                $totalPrice = $params['total_price'];
                $remarks = $params['remarks'];
                $billNum = ($type == 2 ? 'XH' : 'GH') . date('YmdHis');
                $unitInfoJsonArray = $params['unit_info'];
                $unitPrice = $params['unit_price'];
                $billExt = [];
                $goodsStock = new \app\admin\model\GoodsStock();
                //存账单
                Db::startTrans();
                try{
//                    $billModel = new \app\admin\model\Bill();
                    $this->model->data([
                        'bill_num' => $billNum,
                        'admin_id' => $adminId,
                        'merchant_id' => $merchantId,
                        'total_price' => bcmul($totalPrice, 100),
                        'remarks' => $remarks,
                        'type' => $type
                    ]);
                    $billResult = $this->model->save();
                    foreach ($unitInfoJsonArray as $key => &$value){
                        $value = json_decode($value, true);

                        $goodsId = $params['goods_id'][$key][1];
                        $warehouseId = $params['warehouse_id'][$key][1];
                        $num = inputStockInfoToMinStock($params['bill_num'][$key], $value['unit_num']);
                        /*$num =0;
                        foreach ($params['bill_num'][$key] as $k => $inputNum){
                            $num += ($inputNum * ($value['unit_num'][count($value['unit_num']) - 1] / $value['unit_num'][$k]));
                        }*/
                        $stockUnitInfo = [
                            'unit_info' => $value['unit_info'],
                            'unit_name' => $value['unit_name'],
                            'unit_num' => $value['unit_num']
                        ];
                        $result = $goodsStock
                            ->where('goods_id', $goodsId)
                            ->where('warehouse_id', $warehouseId)
//                            ->where('unit_info', json_encode($stockUnitInfo, JSON_UNESCAPED_UNICODE))
                            ->field('stock')->find();
                        if ($type == 2){
                            $currentStock = $result['stock'];
                            if ($currentStock < $num){
                                throw new Exception('第 ' . ($key + 1) . ' 个商品 [' . $params['goods_id'][$key][0] . '] 库存不足');
                            }else{
                                //库存自减
//                                $goodsStock->where('goods_id', $goodsId)->setDec('stock', $num);
//                                $result->setDec('stock', $num);
                                $result->stock = $result->stock - $num;
                                $stockResult = $result->save();
                            }
                        }else{
                            //库存自增
//                            $goodsStock->where('goods_id', $goodsId)->setInc('stock', $num);
//                            $result->setInc('stock', $num);
                            if ($result){
                                $result->stock = $result->stock + $num;
                                $stockResult = $result->save();
                            }else{
                                $stockResult = $goodsStock->data([
                                    'goods_id' => $goodsId,
                                    'warehouse_id' => $warehouseId,
                                    'unit_info' => json_encode($stockUnitInfo, JSON_UNESCAPED_UNICODE),
                                    'stock' => $num,
                                ])->save();
                            }
                        }
                        $value['unit_price'] = $unitPrice[$key];
                        $goodsMerchantData = [
                            'unit_info' => json_encode($value, JSON_UNESCAPED_UNICODE),
                            'type' => $type,
                            'merchant_id' => $merchantId,
                            'goods_id' => $goodsId
                        ];
                        $goodsMerchant = new \app\admin\model\GoodsMerchant();
                        $goodsMerchantResult = $goodsMerchant->where(['merchant_id' => $merchantId, 'goods_id' => $goodsId, ])->find();
                        if (!$goodsMerchantResult){
                            $goodsMerchant->data($goodsMerchantData)->save();
                        }else{
                            $goodsMerchantResult->save($goodsMerchantData);
                        }

                        $value['input_num'] = $params['bill_num'][$key];
                        $billExt[$key]['num'] = $num;
                        $billExt[$key]['goods_id'] = $goodsId;
                        $billExt[$key]['warehouse_id'] = $warehouseId;
                        $billExt[$key]['unit_info'] = json_encode($value, JSON_UNESCAPED_UNICODE);
                        $billExt[$key]['subtotal'] = $params['subtotal_price'][$key];
                        $billExt[$key]['bill_id'] = $this->model->id;
                    }
                    $billExtModel = new BillExtend();
                    $billExtResult = $billExtModel->saveAll($billExt);
                    if (!$billResult || !$stockResult || !$billExtResult){
                        throw new Exception('生成账单失败，这是未知错误！');
                    }
                    // 提交事务
                    Db::commit();
                } catch (Exception $e) {
                    // 回滚事务
                    Db::rollback();
                    $this->error($e->getMessage());
                }
                $this->success();
            }
//            $this->error('生成账单失败，这是未知错误！找凌锋处理。2');
            $this->error(__('Parameter %s can not be empty', ''));

        }
        return $this->view->fetch();
    }
}
