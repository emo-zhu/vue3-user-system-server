const mongoose = require('mongoose')
const leaveSchema = mongoose.Schema({
  orderNo: String,
  applyType: Number,
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: Date.now },
  applyUser: {   //申请用户
    userId: String,
    userName: String,
    userEmail: String
  },
  leaveTime: String,
  reasons: String,
  auditUsers: String,
  curAuditUserName: String,
  // 审批流
  auditFlows: [
    {
      userId: String,
      userName: String,
      userEmail: String
    }
  ],
  // 审批日志
  auditLogs: [
    {
      userId: String,
      userName: String,
      createTime: Date,
      remark: String,
      action: String
    }
  ],
  // 审批状态
  applyState: { type: Number, default: 1 },
  createTime: { type: Date, default: Date.now }
})

module.exports = mongoose.model("leaves", leaveSchema, "leaves")