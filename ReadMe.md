# 一，用户登录前后台接口实现

### 安装所需依赖 node

```node
https://gitee.com/notlaughingzzm/vue3_elementPlus_admin/blob/master/src/components/BreadCrumb.vue

npm i   或   yarn
npm i mongoose -S 安装数据库模块
npm i log4js -S   安装日志
```

### 连接数据库 config

```js
db.js;
/**
 * 连接数据库的配置
 */
// 导入数据库
const mongoose = require("mongoose");
// 导入数据库地址
const config = require("./index");
// 导入日志追踪打印
const log4js = require("./../utils/log4j");

// 开始连接数据库  地址+占位
mongoose.connect(config.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 启动响应
const db = mongoose.connection;

db.on("error", () => {
  log4js.error("启动失败");
});

db.on("open", () => {
  log4js.info("启动成功");
});
```

```js
index.js;
// 连接数据库地址
module.exports = {
  // 配置路径,对应数据库的表
  URL: "mongodb://127.0.0.1:27017/imooc-manager",
  // URL: 'mongodb://127.0.0.1:27017/jianshu'
};
```

### 编写模型对象 models

```js
userSchema.js;

/**
 * 创建用户模型对象
 */

// 导入数据库模块
const mongoose = require("mongoose");
// 配置用户模型对象
const userSchema = mongoose.Schema({
  userId: Number, //用户ID，自增长
  username: String, //用户名称
  pwd: String, //用户密码，md5加密
  userEmail: String, //用户邮箱
  mobile: String, //手机号
  sex: Number, //性别 0:男  1：女
  deptId: [], //部门
  job: String, //岗位
  state: {
    type: Number,
    default: 1,
  }, // 1: 在职 2: 离职 3: 试用期
  role: {
    type: Number,
    default: 1,
  }, // 用户角色 0：系统管理员  1： 普通用户
  roleList: [], //系统角色
  createTime: {
    type: Date,
    default: Date.now(),
  }, //创建时间
  lastLoginTime: {
    type: Date,
    default: Date.now(),
  }, //更新时间
  remark: String,
});
// 抛出用户模型对象
const User = mongoose.model("users", userSchema);
module.exports = {
  User,
};
// module.exports = mongoose.model("users", userSchema, "users")
```

### 定义路由 router

```js
users.js;
/**
 *  用户路由
 */
const router = require("koa-router")();
// 导出用户图像摸快
const { User } = require("./../models/userSchema");
// 导出用户成功状态吗
const util = require("./../utils/util");
// 用户一级路由
// const router = require('koa-router')()
// 用户二级路由
router.prefix("/users");

// ctx 可以拿到请求参数
router.post("/login", async (ctx) => {
  // let { username, pwd } = ctx.require.body
  // await User.findOne({ username, pwd }).then(res => {
  //   if (res) {
  //     ctx.body = res
  //   } else {
  //     ctx.body = util.fail("账号或密码不对")
  //   }
  // }).catch(err => {
  //   ctx.body = util.fail(err)
  // })

  // 捕获，抛出错误
  try {
    let { username, pwd } = ctx.request.body;
    const res = await User.findOne({ username, pwd });
    if (res) {
      ctx.body = util.success(res);
    } else {
      ctx.body = util.fail("账号或密码不对");
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

// 抛出路由对象
module.exports = router;
```

### 入口文件中全局导入 app

```js
app.js;

/**
 * 服务端入口文件 app.js
 */

const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const log4js = require("./utils/log4j");
const users = require("./routes/users");
const router = require("koa-router")();

// const cors = require('koa2-cors')  // 解决跨域
router.prefix("/api"); // 二级路由   http://localhost:3000/api/users/login

// error handler
onerror(app);

// 注册使用数据库
require("./config/db");

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());
app.use(logger());
app.use(require("koa-static")(__dirname + "/public"));

// app.use(cors()) 使用跨域

app.use(
  views(__dirname + "/views", {
    extension: "ejs",
  })
);

// logger 记录器
app.use(async (ctx, next) => {
  await next();
  log4js.info("log output");
});

// routes 路由使用
router.use(users.routes(), users.allowedMethods());
app.use(router.routes(), router.allowedMethods());
// app.use(users.routes(), users.allowedMethods())

// error-handling
app.on("error", (err, ctx) => {
  log4js.error(`${err.stack}`);
});

// 全局导出  app 实例
module.exports = app;
```

# 二，JWT

### 什么是jwt ?

```

```



### 安装插件

```js
npm install jsonwebtoken  或  yarn add jsonwebtoken -S     jwt模块安装
yarn add koa-jwt -S   中间件
```

### jwt  的基本使用

```js
app.js   使用

// 导入JWT 模块
const jwt = require('jsonwebtoken')
// 中间件
const koajwt = require('koa-jwt')


// logger 记录器
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`)
  await next().catch((err) => {
    if (err.status == '401') {
      ctx.status = 200;
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err;
    }
  })

})
app.use(koajwt({ secret: 'imooc' }).unless({
  path: [/^\/api\/users\/login/]
}))


// router.get('/leave/count', (ctx) => {
//   console.log(ctx.request.headers);
//   // const token = ctx.request.headers.authorization.split(' ')[1]
//   // const payload = jwt.verify(token, 'imooc')
//   ctx.body = 'payload'
// })
```

### 登录使用  jwt 

```js
users.js


const router = require('koa-router')()
// 导出用户图像摸快
const { User } = require('./../models/userSchema')
// 导出用户成功状态吗
const util = require('./../utils/util')
// 用户一级路由
// const router = require('koa-router')()
// 用户二级路由
router.prefix('/users')
// 导入JWT 模块
const jwt = require('jsonwebtoken')


// ctx 可以拿到请求参数
router.post('/login', async (ctx) => {
  try {
    const { username, pwd } = ctx.request.body
    /**
     * 返回数据库指定字段，有三种方式
     * 1. 'userId userName userEmail state role deptId roleList'
     * 2. {userId:1,_id:0}
     * 3. select('userId')
     */
    const res = await User.findOne({ username, pwd }, 'userId username userEmail state role deptId roleList')
    const data = res._doc  //加密data
    console.log(data);
      
    // 指定签名 
    const token = jwt.sign({
      data: data
    }, 'imooc', { expiresIn: '1h' })
    // 打印查看token
    console.log('token', token);

    if (res) {
      data.token = token
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail("账号或密码不对")
    }

  } catch (error) {
    ctx.body = util.fail(error.msg)
  }

})

// 抛出路由
module.exports = router


```

# 三，用户管理后台实现接口

### app.js 入口文件更新

```js
/**
 * 服务端入口文件 app.js
 */
const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const log4js = require('./utils/log4j')
const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const koajwt = require('koa-jwt')
const util = require('./utils/util')
const users = require('./routes/users')



// error handler
onerror(app)

// 注册使用数据库
require('./config/db')


// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))


app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`)
  await next().catch((err) => {
    if (err.status == '401') {
      ctx.status = 200;
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err;
    }
  })
})
 
app.use(koajwt({ secret: 'imooc' }).unless({
  path: [/^\/api\/users\/login/]
}))


router.prefix("/api") // 二级路由   http://localhost:3000/api/users/login

// routes 路由使用
router.use(users.routes(), users.allowedMethods())
app.use(router.routes(), router.allowedMethods())


// error-handling
app.on('error', (err, ctx) => {
  log4js.error(`${err.stack}`)
});

// 全局导出  app 实例
module.exports = app

```

### util 工具函数更新

```js
/**
 * 通用工具函数
 */
...
  decoded(authorization) {
    if (authorization) {
      let token = authorization.split(' ')[1]
      return jwt.verify(token, 'imooc')
    }
    return '';
  },
}
```

### 用户接口实现

```js
Users.js



const router = require('koa-router')()
// 导出用户图像摸快
const { User } = require('./../models/userSchema')
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
 ......
})


// 用户列表
router.get('/list', async (ctx) => {
  const { userId, username, state } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId;
  if (username) params.username = username;
  if (state && state != '0') params.state = state;
  try {
    // 根据条件查询所有用户列表
    const query = User.find(params, { _id: 0, userPwd: 0 })
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params);

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


// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  // 待删除的用户Id数组
  const { userIds } = ctx.request.body
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  try {
    ctx.body = util.success(res, `共删除成功${res.matchedCount}条`)
    return;
  } catch (error) {
    ctx.body = util.fail('删除失败');
  }




})

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  const { userId, username, userEmail, mobile, job, state, roleList, deptId, action } = ctx.request.body;
  if (action == 'add') {
    if (!username || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return;
    }
    const res = await User.findOne({ $or: [{ username }, { userEmail }] }, '_id username userEmail')
    if (res) {
      ctx.body = util.fail(`系统监测到有重复的用户，信息如下：${res.username} - ${res.userEmail}`)
    } else {
      const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
      try {
        // 创建一个对象
        const user = new User({
          userId: doc.sequence_value,
          username,
          pwd: md5('123456'),
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
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return;
    }
    try {
      const res = await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId, })
      ctx.body = util.success({}, '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.stack, '更新失败')
    }
  }
})
    
// yarn add md5 -D

// 抛出路由
module.exports = router


```

### 安装md5 加密

```node
yarn add md5 -D
```

### 列表排序id      创建模型

```js
/**
 * 维护用户ID自增长表
 */
const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  _id: String,
  sequence_value: Number
})

module.exports = mongoose.model("counter", userSchema, "counters")



在数据库理创建 counters 表
```

### 难点

```js
用户注册：密码基于md5摘要算法实现。也可基于其它算法（RSA或AES）再前端进行加密传输。
安全性保障措施：
1. 使用https协议，添加数字证书，确保信息安全
2. 使用加密算法，对重要信息进行加密处理。
对称加密：DES、AES、RC5、RC6
非对称加密：RSA、DSA
摘要算法：md5（简单密码容易暴力破解）
完善用户登录功能
1. 登录和注册功能，对于加密信息保持一致。
核心知识点
1. 交互风格统一（条件查询、列表数据、操作按钮、新增弹框、分页）
2. 开发流程清晰（静态布局、动态交互、数据Mock、接口联调、功能完善）
3. 日期格式化插件开发
Mongo语法
1. User.findOne() // 查询一条数据
2. User.find() // 查询所有符合条件的数据
3. User.find().skip().limit() // 专门用于数据分页
4. User.countDocuments({}) // 统计总数量
5. User.updateMany() // 更新用户信息
6. { userId: { $in: [100001,100002] } // 判断userId在[100001,100002]中间
7. { $or: [{ userName:‘jack’ }, { userEmail:‘jack@imooc.com’ }] } // 或 条件判断
8. { $inc: { sequence_value: 1 } // 更新值 +1
Mongo返回字段的四种方式
1. ‘userId userName userEmail state role deptId roleList’
2. { userId:1,_id:0 }
3. select(‘userId’)
4. select({ userId:1,_id:0 })
User.findOne({ userName,userPwd }, 'userId userName userEmail state role deptId roleList')
// Or
User.findOne({ userName,userPwd }, { userId:1,_id:0 })
// Or
User.findOne({ userName,userPwd }).select('userId userName userEmail')
// Or
User.findOne({ userName,userPwd }).select({ userId:1,_id:0 })
```

# 四，菜单管理接口实现

### app.js 更新

``` js
/**
 * 服务端入口文件 app.js
 */
......

const users = require('./routes/users')
const menus = require('./routes/menus')    导入菜单



......


router.prefix("/api") // 二级路由   http://localhost:3000/api/users/login

// routes 路由使用
router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())   路由使用菜单
app.use(router.routes(), router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(`${err.stack}`)
});

// 全局导出  app 实例
module.exports = app

```

### 创建菜单模型对象

``` js
menuschema.js
const mongoose = require('mongoose')
// 树形菜单
const userSchema = mongoose.Schema({
  menuType: Number,//菜单类型
  menuName: String,//菜单名称
  menuCode: String,//权限标识
  path: String,//路由地址
  icon: String,//图标
  component: String,//组件地址
  menuState: Number,//菜单状态
  parentId: [mongoose.Types.ObjectId],   获取id
  "createTime": {
    type: Date,
    default: Date.now()
  },//创建时间
  "updateTime": {
    type: Date,
    default: Date.now()
  },//更新时间
})
导出
module.exports = mongoose.model("menu", userSchema, "menus")
```

### 菜单管理接口实习  router -> menus

```js
// 一级路由
const router = require('koa-router')()
// 工具函数
const util = require('../utils/util')
// 菜单模型
const Menu = require('../models/menuSchema')
// 二级路由 ，前缀
router.prefix('/menu')  api/menu/list


// 菜单列表接口
router.get('/list', async ctx => {
  // 拿到前端的参数  名字 和 状态
  const { menuName, menuState } = ctx.request.query;
   // 定义空对象
  const params = {}
  // 存在就给 params
  if (menuName) params.menuName = menuName;
   // 存在就给 params
  if (menuState) params.menuState = menuState;
    // 通过find查询
  let rootList = await Menu.find(params) || []
  // 把数据转成树形菜单
  const permissionList = getTreeMenu(rootList, null, [])
  // 数据响应回去
  ctx.body = util.success(permissionList);
})

// 递归拼接树形列表
function getTreeMenu(rootList, id, list) {

  // 一级
  for (let i = 0; i < rootList.length; i++) {
      // 拿到每个
    let item = rootList[i];
    if (String(item.parentId.slice().pop()) == String(id)) {
      console.log(item);
      list.push(item._doc)
    }
  }
  // 二级
  list.map(item => {
    item.children = []
    getTreeMenu(rootList, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children
    } else if (item.children.length > 0 && item.children[0].menuType == 2) {
      // 快速区分按钮和菜单，用于后期做按钮菜单权限控制
      item.action = item.children
      // delete item.children
    }
  })

  return list
}


// 编辑/创建接口
router.post('/operate', async (ctx) => {
  // 结构出请求body，拿到用户行为action
  const { _id, action, ...params } = ctx.request.body
  let res, info;
  // 
  try {
    if (action == 'add') {
      res = await Menu.create(params)
      info = '创建成功'
    } else if (action == 'edit') {
      params.updateTime = new Date();
      res = await Menu.findByIdAndUpdate(_id, params);
      info = '编辑成功'
    } else {
      res = await Menu.findByIdAndRemove(_id)
      await Menu.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success('', info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
})

module.exports = router;
```

### 难点

```js
功能清单：
1. 菜单列表
2. 菜单创建
3. 菜单编辑
4. 菜单删除
5. 菜单名称递归展示
接口调用：
菜单列表： /menu/list
菜单创建/编辑/删除： /menu/operate
Mongo语法：
1. 根据ID查找并更新
2. 根据ID查找并删除
3. 查找表中parentId包含[id]的数据，并批量删除
注意KaTeX parse error: Expected 'EOF', got '和' at position 4: all ̲in区别：
$all 指的是表中某一列包含[id]的数据，例如：parentId:[1,3,5] 包含 [3]
$in 指的是表中某一列在[id]这个数组中，例如：_id:3 在[1,3,5]中
Menu.findByIdAndUpdate(_id, params)
Menu.findByIdAndRemove(_id)
Menu.deleteMany({ parentId: { $all: [_id] } })
```

# 五，角色管理接口实现

### app.js更新

```js
......

const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')

......

router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
app.use(router.routes(), router.allowedMethods())

......
```

### 创建角色模型对象

```js
const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    roleName: String,
    remark: String,
    permissionList: {
        checkedKeys: [],
        halfCheckedKeys: []
    },
    updateTime: {
        type: Date,
        default: Date.now()
    },
    createTime: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model("roles", userSchema, "roles")
```

### 角色接口实现 Router - roles

```js
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
```

### 难点

```js
功能清单：
1. 角色列表
2. 角色创建
3. 角色编辑
4. 角色删除
5. 菜单权限设置
6. 角色权限列表递归展示
接口调用：
角色列表： /roles/list
菜单列表： /menu/list
角色操作： /roles/operate
权限设置： /roles/update/permission
所有角色列表： /roles/allList
注意事项：
1. 分页参数 { ...this.queryForm, ...this.pager, }
2. 角色列表展示菜单权限，递归调用actionMap
3. 角色编辑 nextTick
4. 理解权限设置中 checkedKeys 和 halfCheckedKeys
RBAC模型：
Role-Base-Access-Control
用户分配角色 -> 角色分配权限 -> 权限对应菜单、按钮
用户登录以后，根据对应角色，拉取用户的所有权限列表，对菜单、按钮进行动态渲染。
模块封装
加强自身对通用模块封装能力、提高开发效率，不断积累架构思维，提高自身核心竞争力。
```

# 六，部门管理

### app.js 更新

```js
.....
const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')
const depts = require('./routes/depts')
......

// routes 路由使用
router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
router.use(depts.routes(), depts.allowedMethods())
app.use(router.routes(), router.allowedMethods())

......
```

### 创建部门模型对象

```js
const mongoose = require('mongoose')
const deptSchema = mongoose.Schema({
  deptName: String,
  userId: String,
  userName: String,
  userEmail: String,
  parentId: [mongoose.Types.ObjectId],
  updateTime: {
    type: Date,
    default: Date.now()
  },
  createTime: {
    type: Date,
    default: Date.now()
  },
})

module.exports = mongoose.model("depts", deptSchema, "depts")
```

### 部门管理接口实现 Router - depts

```js
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
```

### 所有用户接口 Rouer- users

```js

// 获取全量用户列表
router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find({}, "userId userName userEmail")
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})
```



### 难点

```js
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
```

# 七，权限控制，动态路由

### 权限控制接口实现

```js

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





// 获取用户对应的权限菜单
router.get("/getPermissionList", async (ctx) => {
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let menuList = await getMenuList(data.role, data.roleList);
  let actionList = getAction(JSON.parse(JSON.stringify(menuList)))
  ctx.body = util.success({ menuList, actionList });
})

async function getMenuList(userRole, roleKeys) {
  let rootList = []
  if (userRole == 0) {
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


```

### 工具函数

```js
 // 递归拼接树形列表
  getTreeMenu(rootList, id, list) {
    for (let i = 0; i < rootList.length; i++) {
      let item = rootList[i]
      if (String(item.parentId.slice().pop()) == String(id)) {
        list.push(item._doc)
      }
    }
    list.map(item => {
      item.children = []
      this.getTreeMenu(rootList, item._id, item.children)
      if (item.children.length == 0) {
        delete item.children;
      } else if (item.children.length > 0 && item.children[0].menuType == 2) {
        // 快速区分按钮和菜单，用于后期做菜单按钮权限控制
        item.action = item.children;
      }
    })
    return list;
  },
```

### 难点

```
1. 递归拼接树形列表
```

# 八，审批管理

### 创建审批管理模型对象

```js
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
```

### app更新

```js
const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')
const depts = require('./routes/depts')
const leaves = require('./routes/leaves')


// routes 路由使用
router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
router.use(depts.routes(), depts.allowedMethods())
router.use(leaves.routes(), leaves.allowedMethods())
app.use(router.routes(), router.allowedMethods())
```

### 路由接口实现

```js
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
      if (applyState == 1 || applyState == 2) {
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
    // 
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

```

### 难点

```js
业务难点
审核人员 - 待审批列表：
审核人员 - 审批通过/审批拒绝/作废列表：
// 1、我是第一审核人
params = { curAuditUserName : data.userName, applyState:1 }
// 我是第二或第三审核人
params = { curAuditUserName : data.userName, applyState:2 }
// 所以，完整的查询条件如下：
params = { curAuditUserName : data.userName, $or:[ {applyState:1}, {applyState:2} ] }
// 审批流里面需要包含我，注意这是一个子文档查询
params = { "auditFlows.userId" : data.userId }

审核接口 - 拒绝/同意
技术难点
条件查询：
// 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
if (action == "refuse") {
params.applyState = 3;
}else {
// 审核通过,如果审批流中的人员数量和日志的数量相同，则说明流程已经走完。
if (doc.auditFlows.length == doc.auditLogs.length) {
ctx.body = util.success('当前申请单已处理，请勿重复提交')
return;
} else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
// 判断是否为最后一级审批人员
params.applyState = 4;
} else if (doc.auditFlows.length > doc.auditLogs.length) {
// 判断是中间的处理人员，获取下一级审核人信息
params.applyState = 2;
params.curAuditUserName = doc.auditFlows[doc.auditLogs.length + 1].userName;
}
}
// 添加每一级审批日志
auditLogs.push({
userId: data.userId,
N d t N
// 审核状态是1或者审核状态是2
let params = { curAuditUserName : data.userName, $or:[ {applyState:1}, {applyState:2} ] }
Leave.find(params)
// 子文档列表中包含data.userId
let params = { "auditFlows.userId": data.userId }
Leave.find(params)
```

# 总结

### 1.接口实现步骤

```
1. 连接数据库
2. 创建模型对象
3. 对应路由接口
4. app 使用
```

### 2. MongoDB语法

```js
模型对象.语法（{}）

```

查找单个

```js
/**
     * 返回数据库指定字段，有三种方式
     * 1. 'userId userName userEmail state role deptId roleList'
     * 2. {userId:1,_id:0}
     * 3. select('userId')
  */
User.findOne({params})    查找单个数据
const res = await User.findOne({
      userName,
      pwd
    }, 'userId userName userEmail state role deptId roleList')
```

查找所有

```js
User.find(params, { _id: 0, userPwd: 0 })
```

计数

```js
 User.countDocuments(params);
```

更新多个数据

```js
User.updateMany({ userId: { $in: userIds } }, { state: 2 })
$in  在userIds 里面更新
```

更新单个数据

```js
Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
```

根据id更新

```js
Menu.findByIdAndUpdate(_id, params);
```

创建数据表

```js
Menu.create(params)
```

根据id删除

```js
Role.findByIdAndRemove(_id)
```

删除多个

```
Dept.deleteMany({ parentId: { $all: [_id] } })
 $all: [_id]  返回所有id数组
```

### 3. 递归

```js
 let tressList = getTreeDept(rootList, null, [])

// 递归拼接树形列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
      // 获取每一项
    let item = rootList[i]
    // 判断父id是否为空 ，一级
    if (String(item.parentId.slice().pop()) == String(id)) {
        // 返回数据
      list.push(item._doc)
    }
  }
    // 返回的数据遍历
  list.map(item => {
      // 子数组
    item.children = []
      // 继续调用递归函数
    getTreeDept(rootList, item._id, item.children)
      // 
    if (item.children.length == 0) {
      delete item.children;
    }
  })
  return list;
}
```

### 4. token使用

```js
安装 token

app.js
const jwt = require('jsonwebtoken')
const koajwt = require('koa-jwt')

忽略token
app.use(koajwt({ secret: 'imooc' }).unless({
  path: [/^\/api\/users\/login/]
}))

// 解密token
  decoded(authorization) {
    if (authorization) {
      let token = authorization.split(' ')[1]
      return jwt.verify(token, 'imooc')
    }
    return '';
  },
      
  数据加密
 const token = jwt.sign({
        data
      }, 'imooc', { expiresIn: '3h' })
      data.token = token;
      ctx.body = util.success(data)
```

