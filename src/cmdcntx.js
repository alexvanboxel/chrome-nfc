var cmdCntx = function (finalCallback,timeout) {

  var stack = [];
  var that = {};

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
    return finalCallback;
  };
  that.getTimeout = function() {
    return timeout;
  };

  return that;

};