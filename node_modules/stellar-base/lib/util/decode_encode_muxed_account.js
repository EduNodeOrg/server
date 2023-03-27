'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeAddressToMuxedAccount = decodeAddressToMuxedAccount;
exports.encodeMuxedAccountToAddress = encodeMuxedAccountToAddress;

var _stellarXdr_generated = require('../generated/stellar-xdr_generated');

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _strkey = require('../strkey');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a XDR.MuxedAccount forcing the ed25519 discriminant.
 * @function
 * @param {string} address address to encode to XDR.
 * @returns {xdr.MuxedAccount} MuxedAccount with ed25519 discriminant.
 */
function decodeAddressToMuxedAccount(address) {
  return _stellarXdr_generated2.default.MuxedAccount.keyTypeEd25519(_strkey.StrKey.decodeEd25519PublicKey(address));
}

/**
 * Converts an xdr.MuxedAccount to its string representation, forcing the ed25519 representation.
 * @function
 * @param {xdr.MuxedAccount} muxedAccount .
 * @returns {string} address
 */
function encodeMuxedAccountToAddress(muxedAccount) {
  var ed25519 = void 0;
  if (muxedAccount.switch() === _stellarXdr_generated2.default.CryptoKeyType.keyTypeEd25519()) {
    ed25519 = muxedAccount.ed25519();
  } else {
    ed25519 = muxedAccount.med25519().ed25519();
  }

  return _strkey.StrKey.encodeEd25519PublicKey(ed25519);
}