'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pathPaymentStrictSend = pathPaymentStrictSend;

var _stellarXdr_generated = require('../generated/stellar-xdr_generated');

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _decode_encode_muxed_account = require('../util/decode_encode_muxed_account');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a XDR PathPaymentStrictSendOp. A `PathPaymentStrictSend` operation send the specified amount to the
 * destination account crediting at least `destMin` of `destAsset`, optionally through a path. XLM payments create the destination
 * account if it does not exist.
 * @function
 * @alias Operation.pathPaymentStrictSend
 * @param {object} opts Options object
 * @param {Asset} opts.sendAsset - The asset to pay with.
 * @param {string} opts.sendAmount - Amount of sendAsset to send (excluding fees).
 * @param {string} opts.destination - The destination account to send to.
 * @param {Asset} opts.destAsset - The asset the destination will receive.
 * @param {string} opts.destMin - The minimum amount of destAsset to be received
 * @param {Asset[]} opts.path - An array of Asset objects to use as the path.
 * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
 * @returns {xdr.PathPaymentStrictSendOp} Path Payment Strict Receive operation
 */
function pathPaymentStrictSend(opts) {
  switch (true) {
    case !opts.sendAsset:
      throw new Error('Must specify a send asset');
    case !this.isValidAmount(opts.sendAmount):
      throw new TypeError(this.constructAmountRequirementsError('sendAmount'));
    case !opts.destAsset:
      throw new Error('Must provide a destAsset for a payment operation');
    case !this.isValidAmount(opts.destMin):
      throw new TypeError(this.constructAmountRequirementsError('destMin'));
    default:
      break;
  }

  var attributes = {};
  attributes.sendAsset = opts.sendAsset.toXDRObject();
  attributes.sendAmount = this._toXDRAmount(opts.sendAmount);
  try {
    attributes.destination = (0, _decode_encode_muxed_account.decodeAddressToMuxedAccount)(opts.destination);
  } catch (e) {
    throw new Error('destination is invalid');
  }
  attributes.destAsset = opts.destAsset.toXDRObject();
  attributes.destMin = this._toXDRAmount(opts.destMin);

  var path = opts.path ? opts.path : [];
  attributes.path = path.map(function (x) {
    return x.toXDRObject();
  });

  var payment = new _stellarXdr_generated2.default.PathPaymentStrictSendOp(attributes);

  var opAttributes = {};
  opAttributes.body = _stellarXdr_generated2.default.OperationBody.pathPaymentStrictSend(payment);
  this.setSourceAccount(opAttributes, opts);

  return new _stellarXdr_generated2.default.Operation(opAttributes);
}