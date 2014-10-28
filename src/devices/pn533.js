/**
 * This object is a partial implementation of the following spec:
 * NXP 533 Packet Framing
 * http://www.nxp.com/documents/user_manual/157830_PN533_um080103.pdf
 *
 * @param usbDriver
 * @returns {{}}
 */

function pn533(usbDriver) {

  var that = {};
  var currCntx;

  this.receivedFrame = function (frame) {
    var f = new Uint8Array(frame);


    // TODO: implement NACK frame? Error frame?
    // TODO: preamble and postamble frames?

    // TODO: check data checksum?
    // TODO: short cut. Will leave to callback to handle.
    if (f.length == 6 &&
      f[0] == 0x00 &&
      f[1] == 0x00 &&
      f[2] == 0xff &&
      f[3] == 0x00 &&
      f[4] == 0xff &&
      f[5] == 0x00) {
      // Expected positive ack, return and read more.
      console.log(UTIL_fmt("<<< PN533 <<< ACK"));
      return;  // wait for more.
    }

    currCntx.up(f);
  };

  var PN533_TO_PC = function (data, cmdCntx) {
    console.log(UTIL_fmt("<<< PN533 <<< " + UTIL_BytesToHex(data) ));
    return {Data:data.subarray(5),Pop:true};
  }

  var PC_TO_PN533 = function (data, cmdCntx) {
    var dcslen = data.length;

    // header
    var header = new Uint8Array(8);  // header
    header[0] = 0x00;
    header[1] = 0x00;
    header[2] = 0xff;
    header[3] = 0xff;
    header[4] = 0xff;
    header[5] = dcslen >>> 8;
    header[6] = dcslen & 255;
    header[7] = 0x100 - ((header[5] + header[6]) & 255);  // length checksum

    // payload
    var dcs = 0;
    for (var i = 0; i < data.length; ++i) {
      dcs += data[i];
    }

    var chksum = new Uint8Array(2);  // checksum: 2 bytes checksum at the end.
    chksum[0] = 0x100 - (dcs & 255);  // data checksum
    chksum[1] = 0x00;

    payload =  UTIL_concat(UTIL_concat(header, data), chksum);

    console.log(UTIL_fmt(">>> PN533 >>> 00 00 FF FF FF | DCSlen = XX XX | LenCheckSum = XX | " + UTIL_BytesToHex(data) + " | CheckSum = XX XX"));

    cmdCntx.pushLayer({handle: PN533_TO_PC});
    currCntx = cmdCntx;
    usbDriver.writeFrame(payload.buffer);
  };

  usbDriver.registerClient(this);

  that.PC_TO_PN533 = PC_TO_PN533;
  that.PN533_TO_PC = PN533_TO_PC;

  return that;
}