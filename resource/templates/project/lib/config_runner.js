const path = require('path')
const ConfigManager = require('./config_manager.js')
const Utils = require('./utils.js')
const Logger = require('./logger.js')
const HashChecker = require('./hash_cheker.js')


class ConfigRunner {

    constructor(contract, isLocal) {
        this._logger = new Logger('ConfigRunner')
        this._isMainnet = contract.isMainnet
        this._isLocal = isLocal
        if (this._isMainnet && this._isLocal) {
            throw 'the main network environment isLocal should be false.'
        }
        if (typeof (contract) === 'string') {
            this.contract = contract
        } else if (contract.__contractName) {
            this.contract = contract.__contractName
        } else {
            let cls = contract.__contractClass
            this.contract = new cls().__contractName
        }
        if (!this.contract) {
            throw 'contract error.'
        }
    }

    async deploy() {
        if (this._isLocal) {
            await this._localDeploy()
        } else {
            await this._onlineDeploy()
        }
    }

    async runMethods() {
        if (this._isLocal) {
            await this._localRunMethods()
        } else {
            await this._onlineRunMethods()
        }
    }

    get _deployConfig() {
        return ConfigManager.deployConfig(this.contract, this._isMainnet, this._isLocal)
    }

    get _methodsConfig() {
        return ConfigManager.methodsConfig(this.contract, this._isMainnet, this._isLocal)
    }

    async _localDeploy() {
        this._printLine()
        this._logger.d(this.contract, 'deploy begin.')
        let c = require(path.join(__dirname, '../test', this.contract, 'local.js'))
        let deployer = await this._deployer()
        let r = c.setAccount(deployer.getAddressString()).deploy()
        this._logger.d(this.contract, 'deploy result:', JSON.stringify(r))
    }

    async _localRunMethods() {
        let ms = this._methodsConfig.testMethods
        if (!ms) {
            ms = this._methodsConfig.allMethods
        }
        let c = require(path.join(__dirname, '../test', this.contract, 'local.js'))
        for (let i in ms) {
            let m = Utils.trim(ms[i], '@')
            this._printLine()
            this._logger.d(this.contract + '.' + m, 'begin.')
            let p = this._methodsConfig.params[m]
            let caller = await this._caller(p.caller, this.contract + '.' + m + ' ' + ' config caller is null.')
            c.setAccount(caller.getAddressString()).setValue(p.value)
            let r = Reflect.apply(c[m], c, p.args)
            this._logger.d(this.contract, m, 'result:', JSON.stringify(r))
        }
    }

    async _onlineDeploy() {
        this._printLine()
        this._logger.d(this.contract, 'deploy begin...')
        let account = await this._deployer()
        let t = require(path.join(__dirname, '../test', this.contract, 'online.js'))
        let c = this._isMainnet ? t.mainnet : t.testnet
        let r = await c.setAccount(account).deploy()
        if (!r) {
            this._logger.d('deploy failed.')
            return
        }
        this._logger.d('check status ' + r.txhash + ' ...')
        let success = await new HashChecker(r.txhash, this._isMainnet).check()
        if (!success) {
            this._logger.d('deploy failed, error msg:', r.execute_error)
        } else {
            ConfigManager.setOnlineContractAddress(this.contract, r.contract_address, this._isMainnet)
            this._logger.d('deploy success, address:', r.contract_address, 'result:', r.execute_result ? r.execute_result : '')
        }
    }

    async _onlineRunMethods() {
        let ms = this._methodsConfig.testMethods
        if (!ms || ms.length === 0) {
            this._logger.d('testMethods is empty.')
            return
        }
        let t = require(path.join(__dirname, '../test', this.contract, 'online.js'))
        let c = this._isMainnet ? t.mainnet : t.testnet
        for (let i in ms) {
            let m = ms[i]
            let n = Utils.trim(m, '@')
            this._printLine()
            this._logger.d(this.contract + '.' + m, 'begin...')
            let p = this._methodsConfig.params[n]
            let caller = await this._caller(p.caller, this.contract + '.' + m + ' ' + ' config caller is null.')
            c.setAccount(caller).setValue(p.value)
            let r = null
            if (m.startsWith('@')) {
                r = await Reflect.apply(c[n], c, p.args)
            } else {
                r = await Reflect.apply(c[n + 'Test'], c, p.args)
            }
            let success = null
            if (r.txhash) {
                this._logger.d('check status ' + r.txhash + ' ...')
                let checker = new HashChecker(r.txhash, this._isMainnet)
                success = await checker.check()
                r = checker.result
            } else {
                success = Utils.isEmpty(r.execute_error)
                if (success) {
                    r.execute_result = r.result
                    Reflect.deleteProperty(r, 'result')
                }
            }
            if (!success) {
                this._logger.d(this.contract + '.' + m, 'execute error:', r.execute_error)
            } else {
                this._logger.d(this.contract + '.' + m, 'execute success result:', r.execute_result)
            }
        }
    }

    async _deployer() {
        return await ConfigManager.deployerValue(this._isMainnet)
    }

    async _caller(account, nullMsg) {
        if (!account) {
            throw nullMsg
        }
        return await ConfigManager.callerValue(account, this.contract, this._isMainnet)
    }

    _printLine() {
        this._logger.d('-------------------------------------------------------')
    }
}


module.exports = ConfigRunner
