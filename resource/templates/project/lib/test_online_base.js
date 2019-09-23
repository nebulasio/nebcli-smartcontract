const NebAccount = require('nebulas').Account
const TestKeys = require('./test_keys.js')
const ConfigManager = require('./config_manager.js')
const HashChecker = require('./hash_checker.js')
const Logger = require('./logger.js')


class OnlineBase {

    constructor(isMainnet) {
        this.isMainnet = isMainnet
        this._logger = new Logger('Online')
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
            this.__contractAddress = ConfigManager.getOnlineContractAddress(this)
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
        this.__contractAddress = null
    }

    async _getDeployResult(contractName, r) {
        if (!r) {
            let msg = contractName + '.deploy failed'
            this._logger.d(msg)
            throw msg
        }
        this._logger.d('check status ' + r.txhash + ' ...')
        let address = r.contract_address
        let checker = new HashChecker(r.txhash, this.isMainnet)
        let success = await checker.check()
        r = checker.result
        if (!success) {
            this._logger.d(contractName + '.deploy', 'execute error:', r.execute_error)
            throw r.execute_error
        } else {
            ConfigManager.setOnlineContractAddress(contractName, address, this.isMainnet)
            this._logger.d(contractName + '.deploy', 'execute success', 'contract address:', address, 'result:', r.execute_result)
            return r.execute_result
        }
    }

    _testResult(r) {
        if (!r) {
            throw 'netwok error.'
        }
        if (r.result) {
            try {
                return JSON.parse(r.result)
            } catch (_) {
                throw r.result
            }
        }
        if (r.execute_err !== '') {
            throw r.execute_err
        }
    }

    async _getTxResult(info, r) {
        if (!r) {
            let msg = info + ' failed'
            this._logger.d(msg)
            throw msg
        }
        this._logger.d('check status ' + r.txhash + ' ...')
        let checker = new HashChecker(r.txhash, this.isMainnet)
        let success = await checker.check()
        r = checker.result
        if (!success) {
            this._logger.d(info, 'execute error:', r.execute_error)
            throw r.execute_error
        } else {
            this._logger.d(info, 'execute success result:', r.execute_result)
            return JSON.parse(r.execute_result)
        }
    }
}

module.exports = OnlineBase