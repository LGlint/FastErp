<?php

namespace app\admin\controller\goods;

use app\admin\model\GoodsStock;
use app\common\controller\Backend;

/**
 * 商品管理
 *
 * @icon fa fa-circle-o
 */
class Goods extends Backend
{

    /**
     * Goods模型对象
     * @var \app\admin\model\goods\Goods
     */
    protected $model = null;
    protected $selectpageFields = "id,name,category_id,unit_info";

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\goods\Goods;

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
//                    ->with(['admin','category'])
                    ->with(['category'])
                    ->where($where)
                    ->order($sort, $order)
                    ->paginate($limit);

            foreach ($list as $row) {
                $row['unit_info'] = json_decode($row['unit_info'], true);
                $option = '';
                foreach ((array)$row['unit_info']['unit_price'] as $key => $value) {
                    $option .= $value . '元/' . $row['unit_info']['unit_name'][$key] . '┃';
                }
                //  ┃  符号占3个字符  去除最后一个多余的符号
                $row['unit_price'] = substr($option, 0, -3);
                //暂时不知道需不需要显示创建人这个字段
//                $row->getRelation('admin')->visible(['nickname']);
				$row->getRelation('category')->visible(['name']);
            }

            $result = array("total" => $list->total(), "rows" => $list->items());

            return json($result);
        }
        return $this->view->fetch();
    }

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

        foreach ($word as $value){
            if (!empty($value)){
                $this->model->where($value, 'like', "%$value%");
            }
        }

        if (!empty($custom['merchant_id'])){
            $merchantId = $custom['merchant_id'];
            //存在商户id 则 预载入商户商品售价关系表
            $with = [
                'category',
                'goods_merchant' => function ($query) use ($merchantId, $custom) {
                    //增加筛选条件 过滤商户  商品规格单位要相等
                    $query->where(
                        [
                            'merchant_id' => $merchantId,
//                            'fa_goods_merchant.unit_info' => 'fa_goods.unit_info',
                            'type' => $custom['type']
                        ]
                    );
                }
            ];
        }else{
            $with = [
                'category'
            ];
        }

        if (isset($custom['type']) && $custom['type'] == 2){
            //类型为2 代表账单为销货单，应该校验一下是否有库存。不能获取空库存的过去。
            $goodsStock = new GoodsStock();
            $hasStock = $goodsStock->field('goods_id')->where('stock', '>', 0)->select();
            $goodsIds = array_unique(array_column($hasStock->toArray(), 'goods_id'));
            $this->model->whereIn('fa_goods.id', $goodsIds);
        }

        $total = $this->model->count();
        if ($total <= 0){
            return json(['list' => [], 'total' => 0]);
        }
        $list = $this->model
            ->with($with)
            ->page($page, $pagesize)
            ->select()->toArray();
        foreach ($list as &$value){
            $value['unit_info'] = json_decode($value['unit_info'], true);
            if (!empty($value['goods_merchant'])){
                $value['goods_merchant'] = json_decode($value['goods_merchant'][0]['unit_info'], true);
            }
            if (isset($value['category_id'])){
                $value['category_id'] = $value['category']['name'];
                unset($value['category']);
            }
        }
        return json(['list' => $list, 'total' => $total]);
    }

}
