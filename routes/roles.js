/**
 * 用户管理模块
 */
const router = require('koa-router')()
const Role = require('../models/roleSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
router.prefix('/roles')


//  用户列表
router.get('/allList', async ctx => {
  // 捕获
  try {
    // 查询所有 参数，返回值
    const list = await Role.find({}, "_id roleName")
    // 响应回去
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

// 按页获取角色列表
router.get('/list', async ctx => {
  // 后端返回数据  通过ctx.request.query传参
  // 前端返回数据   通过ctx.request.body 接收
  const { roleName } = ctx.request.query
  // 得到分页对象
  const { page, skipIndex } = util.pager(ctx.request.query)
  try {
    // 定义参数
    let params = {}
    // 判断
    if (roleName) params.roleName = roleName
    // 查询所有 返回的事promise对象
    const query = Role.find(params)
    // query.skip(从哪开始).limit(多少条)  分页
    const list = await query.skip(skipIndex).limit(page.pageSize)
    // 总条数 countDocuments()
    const total = await Role.countDocuments(params)
    // ctx.body 统一输出
    ctx.body = util.success({
      list,  //总数据
      page: {   // 分页
        ...page,
        total
      }
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})

// 角色操作;创建，编辑，删除
router.post('/operate', async ctx => {
  // 前端传递的参数  _id, roleName, remark, action 
  const { _id, roleName, remark, action } = ctx.request.body
  // 定义数据存储
  let res, info
  // 捕获
  try {
    // 判断行为  创建
    if (action == 'create') {
      // 创建表 两个字段
      res = await Role.create({ roleName, remark })
      // 提示
      info = "创建成功"
    }
    // 判断行为  编辑
    else if (action == 'edit') {
      if (_id) {
        // 合并参数
        let params = { roleName, remark }
        // 定义时间
        params.update = new Date()
        // 根据_id ,对应的参数更新数据
        res = await Role.findByIdAndUpdate(_id, params)
        // 提示
        info == "编辑成功"
      }
      else {
        // 响应给前端
        ctx.body = util.fail("缺少参数params:_id")
        return
      }
    }
    // 删除行为
    else {
      // 判断 _id
      if (_id) {
        // 根据id 删除
        res = await Role.findByIdAndRemove(_id)
        // 提示
        info = "删除成功"
      }
      else {
        // 响应给前端
        ctx.body = util.fail("缺少参数params:_id")
        return
      }
    }
    // 判断完 返回给前端
    ctx.body = util.success(res, info)
  } catch (error) {
    // 错误
    ctx.body = util.fail(error.stack)
  }
})

// 权限控制
router.post('/update/permission', async ctx => {
  // 获取前端参数 _id, permission
  const { _id, permissionList } = ctx.request.body
  // 
  try {
    // 定义参数
    let params = { permissionList, update: new Date() }
    // 根据 _id 更新
    let res = await Role.findByIdAndUpdate(_id, params)
    // 响应给前端
    ctx.body = util.success(res, "权限设置成功")
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router;