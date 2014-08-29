function SCL3711(usbDriver) {

  // TEMP
  this.vendorId = 0x04e6;
  this.productId = 0x5591
  ;

  var self = this;
  this.usb = usbDriver;
  this.pn533 = pn533(usbDriver);

  this.command = function (adpu, cntx) {
    adpu.debug();
    cntx.pushHandle(adpu.response);

    if (adpu.getCmdType() == 1) {
      self.pn533.PC_TO_PN533(adpu.make(), cntx);
    }
  }

}

SCL3711.prototype.isACR122 = function() { return false; }


// Register the driver with the Device Manager
dev_manager.registerDriver({
  name : "SCL3711",
  vendorId : 0x04e6,
  productId : 0x5591,
  factory : function(usbDriver) {
    return new SCL3711(usbDriver);
  }
});
