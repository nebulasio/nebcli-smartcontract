const TestKeys = require('./test_keys.js')
const LocalContext = require('./neblocal.js').LocalContext
const LocalContractManager = require('./local_contract_manager.js')
const Utils = require('./utils.js')


class LocalBase {

    _setAccount(account) {
        this.__account = account
        return this
    }

    get _account() {
        if (!this.__account) {
            this.__account = TestKeys.caller
        }
        return this.__account
    }

    _setValue(value) {
        this.__value = value
        return this
    }

    get _value() {
        if (!this.__value) {
            this.__value = 0
        }
        return this.__value
    }

    _call(contract, func, value, args) {
        try {
            let name = Utils.contractName(contract)
            let ca = LocalContractManager.getAddress(name)
            if (!ca) {
                throw name + ' has not yet been deployed.'
            }
            return LocalContext._callContract(this._account.getAddressString(), ca, value, func, args)
        } finally {
            this._reset()
        }
    }

    _reset() {
        this.__account = null
        this.__value = 0
    }
}


module.exports = LocalBase
