const path = require('path')
const fs = require('fs')
const Linq = require('linq')
const NebAccount = require('nebulas').Account
const NebUtil = require('../util/neb_util.js').mainnet
const ProjectInfo = require('../common/project_info.js')
const Utils = require('../util/utils.js')
const HashChecker = require('../util/hash_cheker.js')


class Deploy {

    constructor(workspace) {
        Utils.checkRoot(workspace)
        this.projectInfo = new ProjectInfo(workspace)
    }

    async oneKeyDeploy(contracts) {
        let cs = null
        if (!contracts || contracts.length === 0) {
            cs = this.projectInfo.contracts.select(c => c.name).toArray()
        } else {
            let temp = Linq.from(contracts)
            cs = Linq.from(this.projectInfo.contracts).where(c => {
                return temp.any(t => t.toLowerCase() === c.name.toLowerCase())
            }).select(c => c.name).toArray()
        }
        if (!cs || cs.length === 0) {
            throw 'did not find a contract to be deployed.'
        }
        let r = {}
        for (let i in cs) {
            r[cs[i]] = await this._oneKeyDeploy(cs[i])
        }
        return r
    }

    async _oneKeyDeploy(contract) {
        console.log('---------------------------------------------------------')
        console.log(contract)
        let p = path.join(this.projectInfo.workspace, 'build/output', contract + '.js')
        this._checkPath(p)
        let source = String(fs.readFileSync(p))
        let cfg = await this._getConfig(contract)
        console.log('deploy begin...')
        let r = await NebUtil.oneKeyDeploy(cfg.account, source, cfg.args)
        if (!r) {
            throw 'deploy failed.'
        }
        console.log('check status (' + r.txhash + ') ...')
        let checker = new HashChecker(r.txhash)
        let success = await checker.check()
        let result = checker.result
        if (success) {
            console.log('deploy success, address:', r.contract_address, 'result:', result.execute_result ? result.execute_result : '')
        } else {
            console.log('deploy failed, error:', result.execute_error)
        }
    }

    async _getConfig(contract) {
        let p = path.join(this.projectInfo.workspace, 'config/release', contract, 'deploy.json')
        this._checkPath(p)
        let cfg = JSON.parse(String(fs.readFileSync(p)))
        this._checkPath(cfg.deployer)
        let pwd = await Utils.readPwd(path.basename(cfg.deployer) + ' password: ')
        let a = new NebAccount()
        let keystore = String(fs.readFileSync(cfg.deployer))
        a.fromKey(keystore, pwd, false)
        return {
            account: a,
            args: Utils.argsFromConfig(cfg.args)
        }
    }

    _checkPath(p) {
        if (!fs.existsSync(p)) {
            throw (p + ' not found.')
        }
    }
}


module.exports = Deploy