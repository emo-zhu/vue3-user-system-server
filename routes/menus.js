// 一级路由
const router = require('koa-router')()
// 工具函数
const util = require('../utils/util')
// 菜单模型
const Menu = require('../models/menuSchema')
// 二级路由 ，前缀
router.prefix('/menu')


// 菜单列表接口
router.get('/list', async ctx => {
  // 拿到参数 菜单名字,菜单状态
  const { menuName, menuState } = ctx.request.query;
  // 调用参数
  const params = {}
  // 判断菜单名称
  if (menuName) params.menuName = menuName;
  // 判断菜单状态
  if (menuState) params.menuState = menuState;
  // 根据 菜单名字,菜单状态查找所有
  let rootList = await Menu.find(params) || []
  // 调用函数
  const permissionList = util.getTreeMenu(rootList, null, [])
  // ctx.body = util.success(permissionList);
  // getTreeMenu(rootList, null, [])
  ctx.body = util.success(permissionList);
})



// 编辑/创建接口
router.post('/operate', async (ctx) => {
  // 结构出请求body，拿到用户 id,行为action,其他参数
  const { _id, action, ...params } = ctx.request.body
  let res, info;
  // 
  try {
    // 判断新增
    if (action == 'add') {
      // 创建
      res = await Menu.create(params)
      info = '创建成功'
    } else if (action == 'edit') {   // 编辑
      params.updateTime = new Date();
      // 根据id更新
      res = await Menu.findByIdAndUpdate(_id, params);
      info = '编辑成功'
    } else {    // 删除
      // 根据id删除
      res = await Menu.findByIdAndRemove(_id)
      // 删除多个
      await Menu.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success('', info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
})

module.exports = router;