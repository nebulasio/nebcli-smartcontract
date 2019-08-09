const TestKeys = require('./test_keys.js')
const LocalContext = require('./neblocal.js').LocalContext
const LocalContractManager = require('./local_contract_manager.js')
const Utils = require('./utils.js')

class LocalBase {

    setCaller(caller) {
        this._caller = caller
        return this
    }

    get caller() {
        if(!this._caller) {
            this._caller = TestKeys.caller.getAddressString()
        }
        return this._caller
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
        return LocalContext._callContract(this.caller, ca, value, func, args)
    }
}

module.exports = LocalBase