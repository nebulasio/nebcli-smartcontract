const NebAccount = require('nebulas').Account
const TestKeys = require('./test_keys.js')
const ConfigManager = require('./config_manager.js')


class OnlineBase {

    constructor(isMainnet) {
        this.isMainnet = isMainnet
    }

    _setPrivateKey(key) {
        this.__account = NebAccount.NewAccount()
        this.__account.setPrivateKey(key)
        return this
    }

    _setKeystore(keystore, pwd) {
        this.__account = NebAccount.NewAccount()
        this.__account.fromKey(keystore, pwd, false)
        return this
    }

    _setAccount(account) {
        this.__account = account
        return this
    }

    get _account() {
        if (!this.__account) {
            this.__account = TestKeys.caller
        }
        if (!this.__account) {
            throw 'account is null.'
        }
        return this.__account
    }

    _setContractAddress(contractAddress) {
        this.__contractAddress = contractAddress
        return this
    }

    get _contractAddress() {
        if (!this.__contractAddress) {
            this.__contractAddress = ConfigManager.getOnlineContractAddress(this.__contractName, this.isMainnet)
        }
        if (!this.__contractAddress) {
            throw 'contractAddress is null.'
        }
        return this.__contractAddress
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

    _reset() {
        this.__account = null
        this.__value = 0
    }
}

module.exports = OnlineBase