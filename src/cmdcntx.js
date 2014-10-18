var cmdCntx = function (spec) {

  var stack = [];
  var pub = {};
  spec = spec || {};

  var onSuccess = spec.callback || function (f) {
    console.error(UTIL_fmt("!!! onSuccess !!! Default callback for Command Context, received " + JSON.stringify(f)));
  };
  var onError = spec.onError || function (e) {
    console.error(UTIL_fmt("!!! onError !!! Default callback for Command Context, received " + JSON.stringify(e)));
  };
  var timeout = spec.timeout;

  pub.pushHandle = function (handle) {
    stack.push({
        handle: handle
      }
    );
  };
  pub.pushLayer = function (layerContext) {
    stack.push(layerContext);
  };
  pub.popHandle = function () {
    return stack.pop().handle;
  };
  pub.getFinalCallback = function () {
    return onSuccess;
  };
  pub.getTimeout = function () {
    return timeout;
  };
  pub.setCallback = function (cb) {
    onSuccess = cb;
    return this;
  }
  pub.onError = function (cb) {
    onError = cb;
    return this;
  }

  /**
   *  Pop the complete context till the end. The last callback on the stack should be
   *  the receiving callback. The others are part of the layering.
   */
  pub.up = function (value) {
    if (stack.length === 0) {
      try {
        onSuccess(value);
      }
      catch (e) {
        console.error(e);
      }
    }
    else {
      var out = null;
      try {
        var layerContext = stack.pop();
        out = layerContext.handle(value, layerContext, pub, spec.driver);
        if (out.Pop) {
          pub.up(out.Data);
        }
      }
      catch (e) {
        onError(e);
      }
    }
  }
  return pub;
};
