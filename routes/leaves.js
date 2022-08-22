/**
 * 用户管理模块
 */
const router = require('koa-router')()
const Leave = require('../models/leaveSchema')
const Dept = require('../models/deptSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
router.prefix('/leave')

// 查询申请列表/待审批查询
router.get('/list', async (ctx) => {
  // 查询响应数据 applyState，type  申请状态，类型
  const { applyState, type } = ctx.request.query;
  // 获取分页对象
  const { page, skipIndex } = util.pager(ctx.request.query)
  // 获取用户信息  ctx.request.headers.authorization
  let authorization = ctx.request.headers.authorization;
  // 解析 token 拿到数据
  let { data } = util.decoded(authorization)
  try {
    let params = {};
    // 判断通过（待审批）
    if (type == 'approve') {
      // 审批状态 1或2
      if (applyState == 1 || applyState == 2) {
        // 
        params.curAuditUserName = data.userName;
        params.$or = [{ applyState: 1 }, { applyState: 2 }]
      } else if (applyState > 2) {
        params = { "auditFlows.userId": data.userId, applyState }
      } else {
        params = { "auditFlows.userId": data.userId }
      }
    }
    // 没有通过
    else {
      params = {
        "applyUser.userId": data.userId
      }
      if (applyState) params.applyState = applyState;
    }
    // 查找所有
    const query = Leave.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Leave.countDocuments(params);
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })

  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})
// 
router.get("/count", async (ctx) => {
  let authorization = ctx.request.headers.authorization;
  let { data } = util.decoded(authorization);
  try {
    let params = {}
    params.curAuditUserName = data.userName;
    params.$or = [{ applyState: 1 }, { applyState: 2 }]
    const total = await Leave.countDocuments(params)
    ctx.body = util.success(total)
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.message}`)
  }
})

// 操作接口
router.post("/operate", async (ctx) => {
  // 获取id，行为，其他参数
  const { _id, action, ...params } = ctx.request.body
  // 获取用户信息
  let authorization = ctx.request.headers.authorization;
  // 解析用户信息
  let { data } = util.decoded(authorization)
  // 判断创建操作
  if (action == 'create') {
    // 生成申请单号
    let orderNo = "XJ"
    // 拼接单号
    orderNo += util.formateDate(new Date(), "yyyyMMdd");
    // 异步调用计数模型
    const total = await Leave.countDocuments()
    // 添加到   params.orderNo
    params.orderNo = orderNo + total;

    // 获取用户当前部门ID
    let id = data.deptId.pop()
    // 查找负责人信息
    let dept = await Dept.findById(id)
    // 获取人事部门和财务部门负责人信息
    let userList = await Dept.find({ deptName: { $in: ['人事部门', '财务部门'] } })
    // 审批人
    let auditUsers = dept.userName;
    // 审批流
    let auditFlows = [
      { userId: dept.userId, userName: dept.userName, userEmail: dept.userEmail }
    ]
    userList.map(item => {
      auditFlows.push({
        userId: item.userId, userName: item.userName, userEmail: item.userEmail
      })
      auditUsers += ',' + item.userName;
    })

    params.auditUsers = auditUsers;
    params.curAuditUserName = dept.userName;
    params.auditFlows = auditFlows;
    params.auditLogs = []
    params.applyUser = {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail
    }

    let res = await Leave.create(params)
    ctx.body = util.success("", "创建成功")
  } else {
    let res = await Leave.findByIdAndUpdate(_id, { applyState: 5 })
    ctx.body = util.success('', "操作成功")
  }

})
// 待审批
router.post("/approve", async (ctx) => {
  const { action, remark, _id } = ctx.request.body;
  let authorization = ctx.request.headers.authorization;
  let { data } = util.decoded(authorization);
  let params = {}
  try {
    // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
    let doc = await Leave.findById(_id)
    let auditLogs = doc.auditLogs || [];
    if (action == "refuse") {
      params.applyState = 3;
    } else {
      // 审核通过
      if (doc.auditFlows.length == doc.auditLogs.length) {
        ctx.body = util.success('当前申请单已处理，请勿重复提交')
        return;
      } else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
        params.applyState = 4;
      } else if (doc.auditFlows.length > doc.auditLogs.length) {
        params.applyState = 2;
        params.curAuditUserName = doc.auditFlows[doc.auditLogs.length + 1].userName;
      }
    }
    auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: new Date(),
      remark,
      action: action == 'refuse' ? "审核拒绝" : "审核通过"
    })
    params.auditLogs = auditLogs;
    let res = await Leave.findByIdAndUpdate(_id, params);
    ctx.body = util.success("", "处理成功");
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.message}`)
  }
})

module.exports = router;
