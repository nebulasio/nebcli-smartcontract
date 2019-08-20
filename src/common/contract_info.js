const Linq = require('linq')
const fs = require('fs')
const path = require('path')
const Utils = require('../util/utils.js')


class MethodInfo {

    constructor(f) {
        let s = f.toString()
        let reg = new RegExp(/\w+\s*\((.*)\)/)
        this.name = f.name
        if (reg.test(s)) {
            let args = RegExp.$1.trim().split(',')
            this.args = Linq.from(args).select(a => a.trim()).where(a => a.length > 0).toArray()
        }
    }
}


class ContractInfo {

    constructor(filePath) {
        this.workspace = path.join(filePath, '../../..')
        let clzz = require(filePath)
        let contract = new clzz()
        if (Utils.isEmptyString(contract.__contractName)) {
            throw filePath + ' __contractName is null'
        }

        this.name = contract.__contractName
        this.methods = []
        let p = Reflect.getPrototypeOf(contract)
        Object.getOwnPropertyNames(p).forEach(key => {
            const f = contract[key]
            if (typeof (f) === 'function') {
                if (f.name && !f.name.startsWith('_')) {
                    this.methods.push(new MethodInfo(f))
                }
            }
        })
        this.config = { release: this._releaseConfig(), debug: this._debugConfig() }
    }

    _releaseConfig() {
        return {
            deploy: this._deployConfig(true)
        }
    }

    _debugConfig() {
        return {
            deploy: this._deployConfig(false),
            methods: this._methodConfigs(false)
        }
    }

    _deployConfig(isRelease) {
        let p = path.join(this.workspace, 'config', (isRelease ? 'release' : 'debug'), this.name, 'deploy.json')
        return this._configFromFile(p)
    }

    _methodConfigs(isRelease) {
        let p = path.join(this.workspace, 'config', (isRelease ? 'release' : 'debug'), this.name, 'methods.json')
        return this._configFromFile(p)
    }

    _configFromFile(filePath) {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile) {
            return JSON.parse(String(fs.readFileSync(filePath)))
        }
        return null
    }
}


module.exports = ContractInfo
