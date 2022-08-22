/**
 * 连接数据库的配置
 */
// 导入数据库
const mongoose = require('mongoose')
// 导入数据库地址
const config = require('./index')
// 导入日志追踪打印
const log4js = require('./../utils/log4j')

// 开始连接数据库  地址+占位
mongoose.connect(config.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// 启动响应
const db = mongoose.connection

db.on('error', () => {
  log4js.error('启动失败')
})

db.on('open', () => {
  log4js.info('启动成功')
})