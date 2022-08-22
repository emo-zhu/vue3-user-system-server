

// 添加
const add = (model, params, ctx) => (
  model.create(params).then(result => {
    if (result) {
      ctx.body = {
        code: 200,
        msg: '添加成功',
        data: result
      }
    } else {
      ctx.body = {
        code: 300,
        msg: '添加失败'
      }
    }

  }).catch(err => {
    ctx.body = {
      code: 400,
      msg: '添加异常'
    }
    console.log(err);
  })
)
// 删除
const del = (model, where, ctx) => (
  model.findOneAndDelete(where).then(rel => {
    ctx.body = {
      result: rel
    }
  }).catch(err => {
    ctx.body = {
      code: 400,
      msg: '添加异常'
    }
    console.log(err);
  })
)
// 修改
const update = (model, where, params, ctx) => (model.updateOne(
  where, params
).then(rel => {
  ctx.body = {
    result: rel
  }
}).catch(err => {
  ctx.body = {
    code: 400,
    msg: '添加异常'
  }
  console.log(err);
}))
// 查询单个
const findOne = (model, where, ctx) => (model.findOne({
  where
}).then(rel => {
  ctx.body = {
    result: rel
  }
}).catch(err => {
  ctx.body = {
    code: 400,
    msg: '异常'
  }
  console.log(err);
}))

// 查询所有
const find = (model, where, ctx) => (
  model.find(where).then(rel => {
    ctx.body = {
      result: rel
    }
  }).catch(err => {
    ctx.body = {
      code: 400,
      msg: '异常'
    }
    console.log(err);
  })
)

module.exports = {
  find,
  add,
  update,
  findOne,
  del
}