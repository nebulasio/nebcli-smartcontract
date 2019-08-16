const fs = require('fs')
const path = require('path')
const NebAccount = require('nebulas').Account
const Linq = require('linq')
const TestKeys = require('./test_keys.js')
const Utils = require('./Utils.js')
const LocalContractManager = require('./local_contract_manager.js')


class ConfigManager {

    deployConfig(contract, isMainnet, isLocal) {
        let name = Utils.contractName(contract)
        return this._deployConfig(name, isMainnet, isLocal)
    }

    methodsConfig(contract, isMainnet, isLocal) {
        let name = Utils.contractName(contract)
        return this._methodsConfig(name, isMainnet, isLocal)
    }

    async deployerValue(isRelease) {
        let p = path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), 'deploy.json')
        if (!fs.existsSync(p)) {
            throw p + ' not found.'
        }
        let v = JSON.parse(String(fs.readFileSync(p))).deployer
        if (!v) {
            throw 'config deployer is null.'
        }

        let a = this._testKeysOrPrivateKeyAccount(v)
        if (a != null) {
            return a
        }
        // keystore
        return this._keystoreAccount(path.dirname(p), v)
    }

    async callerValue(v, contract, isRelease) {
        let a = this._testKeysOrPrivateKeyAccount(v)
        if (a != null) {
            return a
        }
        // keystore
        let name = Utils.contractName(contract)
        let p = this._callerPathValue(name, isRelease)
        return this._keystoreAccount(p, v)
    }

    contractAddressValue(v, isMainnet, isLocal) {
        if (/^\s*\{\s*(\w+?)\s*\}\s*$/.test(v)) {
            let name = RegExp.$1
            if (isLocal) {
                return LocalContractManager.getAddress(name)
            } else {
                let p = path.join(__dirname, '../config', (isMainnet ? 'release' : 'debug'), name, 'address.txt')
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
        let p = path.join(__dirname, '../config', (contract.isMainnet ? 'release' : 'debug'), name, 'address.txt')
        if (fs.existsSync(p)) {
            return String(fs.readFileSync(p))
        } else {
            return null
        }
    }

    setOnlineContractAddress(contract, address, isRelease) {
        let name = Utils.contractName(contract)
        let p = path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), name, 'address.txt')
        Utils.checkAndMakeDir(p)
        fs.writeFileSync(p, address)
    }

    _testKeysOrPrivateKeyAccount(v) {
        // TestKeys
        if (/^\s*\{\s*(\S+?)\s*\}\s*$/.test(v)) {
            let key = RegExp.$1.toLowerCase()
            if (key === 'caller') {
                return TestKeys.caller
            } else if (key === 'deployer') {
                return TestKeys.deployer
            } else if (/^keys\.(\d+)$/.test(key)) {
                let i = parseInt(RegExp.$1)
                if (i >= TestKeys.otherKeys.length) {
                    throw 'keys.' + i + ' out of range.'
                }
                return TestKeys.otherKeys[i]
            } else {
                throw key + ' not defined.'
            }
        }
        // private key
        if (/^\w{64}$/.test(v)) {
            let a = NebAccount.NewAccount()
            a.setPrivateKey(v)
            return a
        }
        return null
    }

    async _keystoreAccount(folderPath, v) {
        let p = Utils.getConfigPath(folderPath, v)
        let pwd = await Utils.readPwd('keystore password:')
        let a = NebAccount.NewAccount()
        a.fromKey(String(fs.readFileSync(p)), pwd, false)
        return a
    }

    _callerPathValue(contract, isRelease) {
        return path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), contract)
    }

    _deployConfig(name, isRelease, isLocal) {
        let p = path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), name, 'deploy.json')
        let r = JSON.parse(String(fs.readFileSync(p)))
        r.args = this._argsFromConfig(r.args, isRelease, isLocal)
        return r
    }

    _methodsConfig(name, isRelease, isLocal) {
        let p = path.join(__dirname, '../config', (isRelease ? 'release' : 'debug'), name, 'methods.json')
        let r = JSON.parse(String(fs.readFileSync(p)))
        if (r.params) {
            for (let k in r.params) {
                r.params[k].args = this._argsFromConfig(r.params[k].args, isRelease, isLocal)
            }
        }
        return r
    }

    _argsFromConfig(argsCfg, isMainnet, isLocal) {
        if (!argsCfg) {
            return []
        }
        if (argsCfg instanceof Array) {
            return Linq.from(argsCfg).select(a=>this._argsValue(a, isMainnet, isLocal)).toArray()
        }
        let r = []
        for (let k in argsCfg) {
            r.push(this._argsValue(argsCfg[k], isMainnet, isLocal))
        }
        return r
    }

    _argsValue(v, isMainnet, isLocal) {
        if (!v) {
            return null
        }
        if (typeof (v) !== 'string') {
            return v
        }
        if (/^\s*\{\s*(\S+?)\s*\}\s*$/.test(v)) {
            let key = RegExp.$1.toLowerCase()
            if (key === 'caller') {
                return TestKeys.caller.getAddressString()
            } else if (key === 'deployer') {
                return TestKeys.deployer.getAddressString()
            } else if (/^keys\.(\d+)$/.test(key)) {
                let i = parseInt(RegExp.$1)
                if (i >= TestKeys.otherKeys.length) {
                    throw 'keys.' + i + ' out of range.'
                }
                return TestKeys.otherKeys[i].getAddressString()
            } else {
                let a = this.contractAddressValue(v, isMainnet, isLocal)
                if (!a) {
                    console.log(v, 'is null.')
                }
                return a
            }
        }
        return v
    }
}


module.exports = new ConfigManager()
