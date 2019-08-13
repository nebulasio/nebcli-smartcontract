const TestKeys = require('./test_keys.js')
const LocalContext = require('./neblocal.js').LocalContext
const LocalContractManager = require('./local_contract_manager.js')
const Utils = require('./utils.js')


class LocalBase {

    setAccount(account) {
        this._account = account
        return this
    }

    get account() {
        if(!this._account) {
            this._account = TestKeys.caller
        }
        return this._account
    }

    setValue(value) {
        this._value = value
        return this
    }

    get value() {
        if (!this._value) {
            this._value = 0
        }
        return this._value
    }

    call(contract, func, value, args) {
        let name = Utils.contractName(contract)
        let ca = LocalContractManager.getAddress(name)
        if (!ca) {
            throw name + ' has not yet been deployed.'
        }
        return LocalContext._callContract(this.account.getAddressString(), ca, value, func, args)
    }
}


module.exports = LocalBase
