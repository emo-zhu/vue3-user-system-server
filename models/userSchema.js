
/**
 * 创建用户模型对象
 */

// 导入数据库模块
const mongoose = require('mongoose')

// 配置用户模型对象
const userSchema = mongoose.Schema({
  "userId": Number,//用户ID，自增长
  "userName": String,//用户名称
  "pwd": String,//用户密码，md5加密
  "userEmail": String,//用户邮箱
  "mobile": String,//手机号
  "sex": Number,//性别 0:男  1：女
  "deptId": [],//部门
  "job": String,//岗位
  "state": {
    type: Number,
    default: 1
  },// 1: 在职 2: 离职 3: 试用期
  "role": {
    type: Number,
    default: 1
  }, // 用户角色 0：系统管理员  1： 普通用户
  "roleList": [], //系统角色
  "createTime": {
    type: Date,
    default: Date.now()
  },//创建时间
  "lastLoginTime": {
    type: Date,
    default: Date.now()
  },//更新时间
  remark: String
})
// 抛出用户模型对象
const User = mongoose.model('users', userSchema)
module.exports = {
  User
}
// module.exports = mongoose.model("users", userSchema, "users")


// 导入数据库
// const mongoose = require('mongoose')
// // 实例化schema对象
// // const schema = new mongoose.Schema({
// //   // 创建规则对应数据库字段
// //   p1: String,
// //   p2: String
// // })

// // 创建model模型对象
// // const Obj = mongoose.model('names', schema)

// // 系统用户模型对象
// const userSchema = new mongoose.Schema({
//   username: String,
//   pwd: String
// })
// const User = mongoose.model('users', userSchema)
// // 抛出模型数据对象
// module.exports = {
//   // Obj
//   User
// }

