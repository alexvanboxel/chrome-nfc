function scl3711(usbDriver) {

  var that = {};

  // TEMP
  that.vendorId = 0x04e6;
  that.productId = 0x5591;

  that.pn533 = pn533(usbDriver);

  that.command = function (adpu, cntx) {
    adpu.debug();
    cntx.pushHandle(adpu.response);

    if (adpu.getCmdType() == 1) {
      that.pn533.PC_TO_PN533(adpu.make(), cntx);
    }
  }

  that.isACR122 = function() { return false; }

  return that;
}

// Register the driver with the Device Manager
dev_manager.registerDriver({
  name : "SCL3711",
  vendorId : 0x04e6,
  productId : 0x5591,
  factory : function(usbDriver) {
    return scl3711(usbDriver);
  }
});
