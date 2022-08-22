const router = require('koa-router')()
const util = require('./../utils/util')
const Dept = require('./../models/deptSchema')

router.prefix('/dept')

// 部门树形列表
router.get('/list', async (ctx) => {
  // 查询数据
  let { deptName } = ctx.request.query;
  // 定义参数
  let params = {}
  // 进行赋值
  if (deptName) params.deptName = deptName;
  // 查找所有
  let rootList = await Dept.find(params)
  // 
  if (deptName) {
    // 全部返回
    ctx.body = util.success(rootList);
  } else {
    let tressList = getTreeDept(rootList, null, [])
    ctx.body = util.success(tressList)
  }
})


// 递归拼接树形列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i]
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
    item.children = []
    getTreeDept(rootList, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children;
    }
  })
  return list;
}

// 部门操作：创建、编辑、删除
router.post('/operate', async (ctx) => {
  // 获取字段
  const { _id, action, ...params } = ctx.request.body;
  // 
  let res, info;
  // 捕获
  try {
    if (action == 'create') {
      await Dept.create(params)
      info = "创建成功"
    } else if (action == 'edit') {
      params.updateTime = new Date()
      await Dept.findByIdAndUpdate(_id, params)
      info = "编辑成功"
    } else if (action == 'delete') {
      await Dept.findByIdAndRemove(_id)
      await Dept.deleteMany({ parentId: { $all: [_id] } })
      info = "删除成功"
    }
    ctx.body = util.success('', info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})


module.exports = router;