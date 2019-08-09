const fs = require('fs')
const path = require('path')
const Linq = require('linq')
const Utils = require('../util/utils.js')


class ConfigGenerator {

    gen(projectInfo) {
        this.projectInfo = projectInfo
        projectInfo.contracts.forEach(c => {
            this._gen(c, true)
            this._gen(c, false)
        })
    }

    _gen(contractInfo, isRelease) {
        let c = isRelease ? contractInfo.config.release : contractInfo.config.debug

        let dc = this._deployCfg(contractInfo)
        dc = this._mergeDeployConfig(dc, c.deploy)
        let dp = path.join(this.projectInfo.workspace, 'config', (isRelease ? 'release' : 'debug'), contractInfo.name, 'deploy.json')
        Utils.checkAndMakeDir(dp)
        fs.writeFileSync(dp, JSON.stringify(dc, null, 2))

        if (!isRelease) {
            let mc = this._methodsCfg(contractInfo)
            mc = this._mergeMethodsConfig(mc, c.methods)
            let mp = path.join(this.projectInfo.workspace, 'config', (isRelease ? 'release' : 'debug'), contractInfo.name, 'methods.json')
            Utils.checkAndMakeDir(mp)
            fs.writeFileSync(mp, JSON.stringify(mc, null, 2))
        }
    }

    _deployCfg(contractInfo) {
        let m = Linq.from(contractInfo.methods).firstOrDefault(i => i.name === 'init')
        if (!m) {
            throw contractInfo.name + ' not found init method'
        }
        let args = {}
        if (m.args && m.args.length > 0) {
            m.args.forEach(a => args[a] = null)
        }
        return {
            deployer: null,
            args: args
        }
    }

    _methodsCfg(contractInfo) {
        let ms = Linq.from(contractInfo.methods).where(i => i.name !== 'init' && i.name !== 'accept').toArray()
        let r = {
            allMethods: Linq.from(ms).select(m => m.name).toArray(),
            testMethods: null,
        }
        let params = {}
        ms.forEach(m => {
            let args = {}
            if (m.args && m.args.length > 0) {
                m.args.forEach(a => args[a] = null)
            }
            params[m.name] = {
                caller: null,
                value: 0,
                args: args
            }
        })
        r.params = params
        return r
    }

    _mergeDeployConfig(newCfg, oldCfg) {
        if (oldCfg) {
            newCfg.deployer = oldCfg.deployer
            newCfg.args = this._mergeArgs(newCfg.args, oldCfg.args)
        }
        return newCfg
    }

    _mergeMethodsConfig(newCfg, oldCfg) {
        if (oldCfg) {
            if (oldCfg.testMethods) {
                newCfg.testMethods = Linq.from(oldCfg.testMethods).where(m => newCfg.allMethods.indexOf(m) >= 0).toArray()
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
