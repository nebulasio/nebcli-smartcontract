const fs = require('fs')
const path = require('path')
const Linq = require('linq')
const Utils = require('../util/utils.js')


class ConfigGenerator {

    gen(projectInfo) {
        this.projectInfo = projectInfo
        this._genDeployCfg(true)
        this._genDeployCfg(false)
        projectInfo.contracts.forEach(c => {
            this._genContractCfg(c, true)
            this._genContractCfg(c, false)
        })
    }

    _genDeployCfg(isRelease) {
        let p = path.join(this.projectInfo.workspace, 'config', (isRelease ? 'release' : 'debug'), 'deploy.json')
        let newCfg = {
            deployer: "{deployer}",
            contracts: []
        }
        let oldCfg = null
        if (fs.existsSync(p)) {
            oldCfg = JSON.parse(fs.readFileSync(p))
        }
        newCfg = this._mergeGlobalDeployConfig(newCfg, oldCfg)
        Utils.checkAndMakeDir(p)
        fs.writeFileSync(p, JSON.stringify(newCfg, null, 2))
    }

    _genContractCfg(contractInfo, isRelease) {
        let c = isRelease ? contractInfo.config.release : contractInfo.config.debug

        let dc = this._deployArgsCfg(contractInfo)
        dc = this._mergeDeployArgsConfig(dc, c.deploy)
        let dp = path.join(this.projectInfo.workspace, 'config', (isRelease ? 'release' : 'debug'), contractInfo.name, 'deploy.json')
        Utils.checkAndMakeDir(dp)
        fs.writeFileSync(dp, JSON.stringify(dc, null, 2))

        let mc = this._methodsCfg(contractInfo)
        mc = this._mergeMethodsConfig(mc, c.methods)
        let mp = path.join(this.projectInfo.workspace, 'config', (isRelease ? 'release' : 'debug'), contractInfo.name, 'methods.json')
        Utils.checkAndMakeDir(mp)
        fs.writeFileSync(mp, JSON.stringify(mc, null, 2))
    }

    _deployArgsCfg(contractInfo) {
        let m = Linq.from(contractInfo.methods).firstOrDefault(i => i.name === 'init')
        if (!m) {
            throw contractInfo.name + ' not found init method'
        }
        let args = {}
        if (m.args && m.args.length > 0) {
            m.args.forEach(a => args[a] = null)
        }
        return {
            args: args
        }
    }

    _methodsCfg(contractInfo) {
        let ms = Linq.from(contractInfo.methods).where(i => i.name !== 'init' && i.name !== 'accept').toArray()
        let r = {
            allMethods: Linq.from(ms).select(m => m.name).toArray(),
            testMethods: [],
        }
        let params = {}
        ms.forEach(m => {
            let args = {}
            if (m.args && m.args.length > 0) {
                m.args.forEach(a => args[a] = null)
            }
            params[m.name] = {
                caller: "{caller}",
                value: 0,
                args: args
            }
        })
        r.params = params
        return r
    }

    _mergeGlobalDeployConfig(newCfg, oldCfg) {
        if (oldCfg) {
            newCfg.deployer = oldCfg.deployer
            newCfg.contracts = oldCfg.contracts
        }
        return newCfg
    }

    _mergeDeployArgsConfig(newCfg, oldCfg) {
        if (oldCfg) {
            newCfg.args = this._mergeArgs(newCfg.args, oldCfg.args)
        }
        return newCfg
    }

    _mergeMethodsConfig(newCfg, oldCfg) {
        if (oldCfg) {
            if (oldCfg.testMethods) {
                newCfg.testMethods = Linq.from(oldCfg.testMethods).where(m => newCfg.allMethods.indexOf(Utils.trim(m, "@")) >= 0).toArray()
            }
            if (oldCfg.params) {
                for (let name in newCfg.params) {
                    let oc = oldCfg.params[name]
                    if (oc) {
                        let nc = newCfg.params[name]
                        nc.caller = oc.caller
                        nc.value = oc.value
                        nc.args = this._mergeArgs(nc.args, oc.args)
                    }
                }
            }
        }
        return newCfg
    }

    _mergeArgs(newArgs, oldArgs) {
        if (oldArgs && newArgs) {
            for (let key in newArgs) {
                if (key in oldArgs) {
                    newArgs[key] = oldArgs[key]
                }
            }
        }
        return newArgs
    }
}


module.exports = new ConfigGenerator()
