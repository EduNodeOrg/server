'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pathPaymentStrictReceive = pathPaymentStrictReceive;

var _stellarXdr_generated = require('../generated/stellar-xdr_generated');

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _decode_encode_muxed_account = require('../util/decode_encode_muxed_account');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a XDR PathPaymentStrictReceiveOp. A `PathPaymentStrictReceive` operation send the specified amount to the
 * destination account, optionally through a path. XLM payments create the destination
 * account if it does not exist.
 * @function
 * @alias Operation.pathPaymentStrictReceive
 * @param {object} opts Options object
 * @param {Asset} opts.sendAsset - The asset to pay with.
 * @param {string} opts.sendMax - The maximum amount of sendAsset to send.
 * @param {string} opts.destination - The destination account to send to.
 * @param {Asset} opts.destAsset - The asset the destination will receive.
 * @param {string} opts.destAmount - The amount the destination receives.
 * @param {Asset[]} opts.path - An array of Asset objects to use as the path.
 * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
 * @returns {xdr.PathPaymentStrictReceiveOp} Path Payment Strict Receive operation
 */
function pathPaymentStrictReceive(opts) {
  switch (true) {
    case !opts.sendAsset:
      throw new Error('Must specify a send asset');
    case !this.isValidAmount(opts.sendMax):
      throw new TypeError(this.constructAmountRequirementsError('sendMax'));
    case !opts.destAsset:
      throw new Error('Must provide a destAsset for a payment operation');
    case !this.isValidAmount(opts.destAmount):
      throw new TypeError(this.constructAmountRequirementsError('destAmount'));
    default:
      break;
  }

  var attributes = {};
  attributes.sendAsset = opts.sendAsset.toXDRObject();
  attributes.sendMax = this._toXDRAmount(opts.sendMax);

  try {
    attributes.destination = (0, _decode_encode_muxed_account.decodeAddressToMuxedAccount)(opts.destination);
  } catch (e) {
    throw new Error('destination is invalid');
  }

  attributes.destAsset = opts.destAsset.toXDRObject();
  attributes.destAmount = this._toXDRAmount(opts.destAmount);

  var path = opts.path ? opts.path : [];
  attributes.path = path.map(function (x) {
    return x.toXDRObject();
  });

  var payment = new _stellarXdr_generated2.default.PathPaymentStrictReceiveOp(attributes);

  var opAttributes = {};
  opAttributes.body = _stellarXdr_generated2.default.OperationBody.pathPaymentStrictReceive(payment);
  this.setSourceAccount(opAttributes, opts);

  return new _stellarXdr_generated2.default.Operation(opAttributes);
}