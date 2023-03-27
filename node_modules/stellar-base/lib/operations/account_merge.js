'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.accountMerge = accountMerge;

var _stellarXdr_generated = require('../generated/stellar-xdr_generated');

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _decode_encode_muxed_account = require('../util/decode_encode_muxed_account');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Transfers native balance to destination account.
 * @function
 * @alias Operation.accountMerge
 * @param {object} opts Options object
 * @param {string} opts.destination - Destination to merge the source account into.
 * @param {string} [opts.source] - The source account (defaults to transaction source).
 * @returns {xdr.AccountMergeOp} Account Merge operation
 */
function accountMerge(opts) {
  var opAttributes = {};
  try {
    opAttributes.body = _stellarXdr_generated2.default.OperationBody.accountMerge((0, _decode_encode_muxed_account.decodeAddressToMuxedAccount)(opts.destination));
  } catch (e) {
    throw new Error('destination is invalid');
  }
  this.setSourceAccount(opAttributes, opts);

  return new _stellarXdr_generated2.default.Operation(opAttributes);
}