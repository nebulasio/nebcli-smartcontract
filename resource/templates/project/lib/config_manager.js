const fs = require('fs')
const path = require('path')
const NebAccount = require('nebulas').Account
const TestKeys = require('./test_keys.js')
const Utils = require('./Utils.js')
const LocalContractManager = require('./local_contract_manager.js')


class ConfigManager {

    debugDeployConfig(contract) {
        let name = Utils.contractName(contract)
        return this._deployConfig(name, false)
    }

    debugMethodsConfig(contract) {
        let name = Utils.contractName(contract)
        return this._methodsConfig(name, false)
    }

    releaseDeployConfig(contract) {
        let name = Utils.contractName(contract)
        return this._deployConfig(name, true)
    }

    async accountValue(v, contract, isRelease) {
        // TestKeys
        if (/^\s*\{\s*(\w+?)\s*\}\s*$/.test(v)) {
            let key = RegExp.$1.toLowerCase()
            if (key === 'caller') {
                return TestKeys.caller
            } else if (key === 'deployer') {
                return TestKeys.deployer
            } else if (/^keys\.{\d+}$/.test(key)) {
                let i = parseInt(RegExp.$1)
                if (i >= TestKeys.otherKeys.length) {
                    throw 'keys.' + i + ' out of range.'
                }
                return TestKeys.otherKeys[i]
            }
        }
        // private key
        if (/^\w{64}$/.test(v)) {
            let a = NebAccount.NewAccount()
            a.setPrivateKey(v)
            return a
        }
        // keystore
        let name = Utils.contractName(contract)
        let p = this._pathValue(v, name, isRelease)
        let pwd = await Utils.readInput('password:')
        let a = NebAccount.NewAccount()
        a.fromKey(fs.readFileSync(p), pwd, false)
        return a
    }

    contractAddressValue(v, isLocal) {
        if (/^\s*\{\s*(\w+?)\s*\}\s*$/.test(v)) {
            let name = RegExp.$1
            if (isLocal) {
                return LocalContractManager.getAddress(name)
            } else {
                let p = path.join(__dirname, '../config/debug', name, 'address.txt')
                if (!fs.existsSync(p)) {
                    throw 'not found ' + p
                }
                return String(fs.readFileSync(p)).trim()
            }
        }
        throw 'contract value "' + v + '" not found.'
    }

    getOnlineContractAddress(contract) {
        let name = Utils.contractName(contract)
        let p = path.join(__dirname, '../config/debug', name, 'address.txt')
        if (fs.existsSync(p)) {
            return String(fs.readFileSync(p))
        } else {
            return null
        }
    }

    setOnlineContractAddress(contract, address) {
        let name = Utils.contractName(contract)
        let p = path.join(__dirname, '../config/debug', name, 'address.txt')
        Utils.checkAndMakeDir(p)
        fs.writeFileSync(p, address)
    }

    _pathValue(v, contract, isRelease) {
        return Utils.getConfigPath(path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), contract), v)
    }

    _deployConfig(name, isRelease) {
        let p = path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), name, 'deploy.json')
        let r = JSON.parse(String(fs.readFileSync(p)))
        r.args = this._argsFromConfig(r.args)
        return r
    }

    _methodsConfig(name, isRelease) {
        let p = path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), name, 'methods.json')
        let r = JSON.parse(String(fs.readFileSync(p)))
        if (r.params) {
            for (let k in r.params) {
                r.params[k].args = this._argsFromConfig(r.params[k].args)
            }
        }
        return r
    }

    _argsFromConfig(argsCfg) {
        if (!argsCfg) {
            return []
        }
        if (argsCfg instanceof Array) {
            return argsCfg
        }
        let r = []
        for (let k in argsCfg) {
            r.push(argsCfg[k])
        }
        return r
    }
}


module.exports = new ConfigManager()
