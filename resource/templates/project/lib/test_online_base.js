const NebAccount = require('nebulas').Account
const TestKeys = require('./test_keys.js')
const ConfigManager = require('./config_manager.js')


class OnlineBase {

    setPrivateKey(key) {
        this._account = NebAccount.NewAccount()
        this._account.setPrivateKey(key)
        return this
    }

    setKeystore(keystore, pwd) {
        this._account = NebAccount.NewAccount()
        this._account.fromKey(keystore, pwd, false)
        return this
    }

    setAccount(account) {
        this._account = account
        return this
    }

    get account() {
        if (!this._account) {
            this._account = TestKeys.caller
        }
        if (!this._account) {
            throw 'account is null.'
        }
        return this._account
    }

    setContractAddress(contractAddress) {
        this._contractAddress = contractAddress
        return this
    }

    get contractAddress() {
        if (!this._contractAddress) {
            this._contractAddress = ConfigManager.getOnlineContractAddress(this.__contractName)
        }
        if (!this._contractAddress) {
            throw 'contractAddress is null.'
        }
        return this._contractAddress
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
}

module.exports = OnlineBase