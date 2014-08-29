/**
 * Created by alexvanboxel on 25/08/14.
 */

var Command = {
};


Command.cardCommand = function(spec,shared) {

  var that = {};

  var getCmdType = function () {
    return 1;
  }
  that.getCmdType = getCmdType;

  return that;
}

Command.deviceCommand = function(spec,shared) {

  var that = {};

  var getCmdType = function () {
    return 2;
  }
  that.getCmdType = getCmdType;

  return that;
}

Command.controllerCommand = function(spec,shared) {

  var that = {};

  var getCmdType = function () {
    return 1;
  }
  that.getCmdType = getCmdType;

  return that;
}