const fs = require('fs')
const path = require('path')
const ConfigManager = require('./config_manager.js')
const HashChecker = require('./hash_checker.js')
const NebUtil = require('./neb_util.js')
const Utils = require('./utils.js')


class DeployManager {
    constructor(isMainnet) {
        this._isMainnet = isMainnet
        this.netUtil = isMainnet ? NebUtil.mainnet : NebUtil.testnet
    }

    async deploy() {
        let deployer = await this._deployer()
        let contracts = this._contracts
        for (let i in contracts) {
            let c = contracts[i]
            let source = this._source(c)
            let args = this._args(c)
            console.log(c, 'deploy begin...')
            let r = await this.netUtil.oneKeyDeploy(deployer, source, args)
            if (!r) {
                console.error(c + ' deploy failed.')
            }
            let checker = new HashChecker(r.txhash, this._isMainnet)
            console.log(c, 'deploy check status. ' + r.txhash)
            let success = await checker.check()
            let result = checker.result
            if (success) {
                ConfigManager.setOnlineContractAddress(c, r.contract_address, this._isMainnet)
                console.log('deploy success, address:', r.contract_address, 'result:', result.execute_result)
            } else {
                throw 'deploy failed, error: ' + result.execute_error
            }
        }
    }

    _source(contract) {
        let p = path.join(__dirname, '../build/output/' + contract + '.js')
        if (!fs.existsSync(p)) {
            throw p + ' not found.'
        }
        return String(fs.readFileSync(p))
    }

    _args(contract) {
        return ConfigManager.deployConfig(contract, this._isMainnet, false).args
    }

    get _contracts() {
        let p = path.join(__dirname, '../config', (this._isMainnet ? 'release' : 'debug'), 'deploy.json')
        if (!fs.existsSync(p)) {
            throw p + ' not found.'
        }
        let cs = JSON.parse(String(fs.readFileSync(p))).contracts
        if (!cs || cs.length === 0) {
            throw 'please set the contracts to be published.'
        }
        return cs
    }

    async _deployer() {
        return await ConfigManager.deployerValue(this._isMainnet)
    }

}


DeployManager.mainnet = new DeployManager(true)
DeployManager.testnet = new DeployManager(false)


module.exports = DeployManager;
