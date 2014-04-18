/**
 * This object is a partial implementation of the following spec:
 * NXP 533 Packet Framing
 * http://www.nxp.com/documents/user_manual/157830_PN533_um080103.pdf
 *
 * @param usbDriver
 * @returns {{}}
 * @constructor
 */
function PN533(usbDriver) {
  var pub = {};
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
      return;  // wait for more.
    }

    currCntx.up();
  };

  return pub;
}