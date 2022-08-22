
const router = require('koa-router')()
// 导出用户图像摸快
const { User } = require('./../models/userSchema')
// 导入菜单模型
const Menu = require('./../models/menuSchema')
// 
const Role = require('./../models/roleSchema')
// 计数器
const Counter = require('./../models/counterSchema')
// 导出用户成功状态吗
const util = require('./../utils/util')
// 用户一级路由
// const router = require('koa-router')()

// md5加密
const md5 = require('md5')
// 用户二级路由
router.prefix('/users')
// 导入JWT 模块
const jwt = require('jsonwebtoken')


// 用户登录
router.post('/login', async (ctx) => {
  try {
    // 获取请求体参数
    const { userName, pwd } = ctx.request.body;

    /**
     * 返回数据库指定字段，有三种方式
     * 1. 'userId userName userEmail state role deptId roleList'
     * 2. {userId:1,_id:0}
     * 3. select('userId')
     */
    // 根据用户名和密码查找，并返回指定字段
    const res = await User.findOne({
      userName,
      pwd
    }, 'userId userName userEmail state role deptId roleList')
    // 判断res存在
    if (res) {
      // 获取res._doc;数据
      const data = res._doc;
      // 加密data，生成token，签名：imooc ，有效时间：3h
      const token = jwt.sign({
        data
      }, 'imooc', { expiresIn: '3h' })
      // token 赋值
      data.token = token;
      // 响应回去
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail("账号或密码不正确")
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})


// 用户列表
router.get('/list', async (ctx) => {
  // 
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state != '0') params.state = state;

  try {
    // 根据条件查询所有用户列表  params 用户状态
    //  不显示{ _id: 0, pwd: 0 }
    const query = User.find(params, { _id: 0, pwd: 0 })
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params);
    // 响应回去
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = util.fail(`查询异常:${error.stack}`)
  }
})

// 获取全量用户列表
router.get('/all/list', async (ctx) => {
  try {
    // 查找所有用户列表   {} 所有对象   "userId userName userEmail" 返回字段
    const list = await User.find({}, "userId userName userEmail")
    // 响应回去
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  // 待删除的用户Id数组
  const { userIds } = ctx.request.body
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
  // 使用 $in 集合 删除多个，根据 userIds更新state 
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  try {
    // 响应回去
    ctx.body = util.success(res, `共删除成功${res.matchedCount}条`)
    return;
  } catch (error) {
    ctx.body = util.fail('删除失败');
  }




})

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  // 请求数据 组成列表
  const { userId, userName, userEmail, mobile, job, state, roleList, deptId, action } = ctx.request.body;
  // 判断行为 新增
  if (action == 'add') {
    // 没有 用户名，用户邮箱，部门id
    if (!userName || !userEmail || !deptId) {
      // 响应回去
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return;
    }
    // 查找单个用户，根据$or: [{ userName }, { userEmail }]，返会 _id userName userEmail 字段
    const res = await User.findOne({ $or: [{ userName }, { userEmail }] }, '_id userName userEmail')
    // 判断用户重复
    if (res) {
      ctx.body = util.fail(`系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
    }
    // 创建一个
    else {
      // 根据 id查找更新 sequence_value: 1  id 自增1
      const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
      // console.log("打印", doc); { _id: 'userId', sequence_value: 1000013 }
      try {
        // 创建一个对象
        const user = new User({
          userId: doc.sequence_value,
          userName,
          pwd: md5('123'),
          userEmail,
          role: 1, //默认普通用户
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        // save创建
        user.save();
        ctx.body = util.success({}, '用户创建成功');
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败');
      }
    }
  }
  // 更新操作
  else {
    // 判断部门存在
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return;
    }
    try {
      // 根据id更新  mobile, job, state, roleList, deptId
      const res = await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId, })
      ctx.body = util.success({}, '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.stack, '更新失败')
    }
  }
})

// yarn add md5 -D


// 获取用户对应的权限菜单
router.get("/getPermissionList", async (ctx) => {
  // 获取请求头信息
  let authorization = ctx.request.headers.authorization
  // 解密请求头获取用户数据
  let { data } = util.decoded(authorization)
  // 调用函数 两个参数 角色,角色列表id
  let menuList = await getMenuList(data.role, data.roleList);
  // 调用函数 一个参数 菜单列表
  let actionList = getAction(JSON.parse(JSON.stringify(menuList)))
  // 响应回去
  ctx.body = util.success({ menuList, actionList });
})
// 菜单列表
async function getMenuList(userRole, roleKeys) {
  // 
  let rootList = []
  // 判断是否管理员 == 0
  if (userRole == 0) {
    // 查找返回所有
    rootList = await Menu.find({}) || []
  } else {
    // 根据用户拥有的角色，获取权限列表
    // 现查找用户对应的角色有哪些
    let roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map(role => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList;
      permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({ _id: { $in: permissionList } })
  }
  return util.getTreeMenu(rootList, null, [])
}

// 行为
function getAction(list) {
  let actionList = []
  const deep = (arr) => {
    while (arr.length) {
      let item = arr.pop();
      if (item.action) {
        item.action.map(action => {
          actionList.push(action.menuCode)
        })
      }
      if (item.children && !item.action) {
        deep(item.children)
      }
    }
  }
  deep(list)
  return actionList;
}
// 抛出路由
module.exports = router

