var cmdCntx = function (spec) {

  var stack = [];
  var that = {};
  var callback = spec.callback;
  var timeout = spec.timeout;

  that.pushLayer = function (handler) {
    stack.push({
        handler : handler
      }
    );
  };
  that.popLayer = function () {
    return stack.pop();
  };
  that.getFinalCallback = function() {
    return callback;
  };
  that.getTimeout = function() {
    return timeout;
  };
  that.setCallback = function(cb) {
    callback = cb;
    return this;
  }

  return that;
};