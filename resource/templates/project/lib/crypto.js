const bs58 = require('bs58')
const nebulas = require("nebulas")
const NebAccount = nebulas.Account
const NebUtils = nebulas.Utils
const NebCryptoUtils = nebulas.CryptoUtils

module.exports = {
    sha3256: function (content) {
        return NebCryptoUtils.bufferToHex(NebCryptoUtils.sha3(content)).substr(2)
    },

    recoverAddress: function (type, hash, sig) {
        let recovery = parseInt(sig.substr(sig.length - 1, 1))
        sig = sig.substr(0, 64 * 2)
        let pubKey = NebCryptoUtils.recover('0x' + hash, '0x' + sig, recovery, false)
        return this._pubKeyToAddress(pubKey)
    },

    _sign: function (hash, privateKey) {
        return NebCryptoUtils.bufferToHex(NebCryptoUtils.sign('0x' + hash, '0x' + privateKey)).substr(2)
    },

    _concat: function () {
        let s = ""
        for (let i in arguments) {
            s += NebCryptoUtils.bufferToHex(arguments[i]).substr(2)
        }
        return NebCryptoUtils.toBuffer('0x' + s)
    },

    _pubKeyToAddress: function (pubKey) {
        let r = NebCryptoUtils.sha3(pubKey)
        r = NebCryptoUtils.ripemd160(r)
        r = this._concat(NebCryptoUtils.toBuffer('0x19'), NebCryptoUtils.toBuffer('0x57'), r)
        let checkSum = NebCryptoUtils.sha3(r).slice(0, 4)
        r = this._concat(r, checkSum)
        return bs58.encode(r)
    }
}