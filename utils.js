exports.callbackify1 = function (fun) {
  return function (arg1, cb) {
    return wrapPromise(fun(arg1), cb)
  }
}

exports.callbackify2 = function (fun) {
  return function (arg1, arg2, cb) {
    return wrapPromise(fun(arg1, arg2), cb)
  }
}


function wrapPromise (p, cb) {
  return p.then(result => cb(null, result))
    .catch(err => cb(err))
}
