var PN53x = {
}

PN53x.InListPassiveTarget = function () {
  this.Type = 1;
  var Type = 1;
  var MaxTg = 0x01;
  var BrTy = 0x00;
  var InitiatorData = null;

  var that = {}

  that.getCmdType = function () {
    return Type;
  }

  that.make = function () {
    return new Uint8Array([0xD4, 0x4A, MaxTg, BrTy]);
  }

  that.response = function (frame) {

  }

  that.debug = function () {
    function BrTyOut(val) {
      switch (val) {
        case 0x00:
          return "'0x00: 106 kbps type A (ISO/IEC14443 Type A)'";
        case 0x01:
          return "'0x01: 212 kbps (FeliCa polling)'";
        case 0x02:
          return "'0x02: 424 kbps (FeliCa polling)'";
        case 0x03:
          return "'0x03: 106 kbps type B (ISO/IEC14443-3B)'";
        case 0x04:
          return "'0x04: 106 kbps Innovision Jewel tag'";
      }
    }

    console.log(UTIL_fmt(">>> PN53x >>> InListPassiveTarget.1 | D4 4A | MaxTg = " + MaxTg + " | BrTy = " + BrTyOut(BrTy)));
    console.log(UTIL_fmt(">>> PN53x >>> InListPassiveTarget.2 | InitiatorData:" + UTIL_BytesToHexWithSeparator(InitiatorData)));
  }

  return that;
}


PN53x.InDeselect = function () {
  var Type = 1;
  var Tg = 0x01;
  var that = {}

  that.getCmdType = function () {
    return Type;
  }

  that.make = function () {
    return new Uint8Array([0xD4, 0x44, Tg]);
  }

  that.response = function (frame) {

  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InDeselect | D4 44 | Tg = " + Tg));
  }
  return that;
}


PN53x.InRelease = function () {
  var Type = 1;
  var Tg = 0x01;

  var that = {}

  that.getCmdType = function () {
    return Type;
  }

  that.make = function () {
    return new Uint8Array([0xD4, 0x52, Tg]);
  }

  that.response = function (frame) {

  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InRelease | D4 52 | Tg = " + this.Tg));
  }
  return that;
}

PN53x.InDataExchange = function (spec) {
  var Type = 1;
  var Tg = 0x01;
  var DataOut = spec.DataOut;

  var that = {};

  that.getCmdType = function () {
    return Type;
  }

  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xD4, 0x40, Tg]), DataOut);
  }

  that.response = function (frame) {

  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InDataExchange | D4 40 | Tg = " +  Tg + " | " + UTIL_BytesToHex(this.DataOut)));
  }

  return that;
}
