const fs = require('fs')
const path = require('path')
const Utils = require('../util/utils.js')


function _genArgs(args) {
    if (!args || args.length === 0) {
        return ''
    } else {
        return args.join(', ')
    }
}

function _genArgsArray(args) {
    if (!args || args.length === 0) {
        return 'Array.from(arguments)'
    } else {
        return '[' + args.join(', ') + ']'
    }
}


class Local {

    constructor(projectInfo) {
        this.projectInfo = projectInfo
    }

    gen() {
        this.projectInfo.contracts.forEach(c => {
            let content = this._genContract(c)
            let p = this._contractPath(c)
            Utils.checkAndMakeDir(p)
            fs.writeFileSync(p, content)
        })
    }

    _contractPath(contractInfo) {
        return path.join(this.projectInfo.workspace, 'test/contracts', contractInfo.name, 'local.js')
    }

    _genContract(contractInfo) {
        let r = String(fs.readFileSync(path.join(__dirname, '../../resource/templates/test/local_contract.txt')))
        r = r.replace(/@contract/g, contractInfo.name)
        let functions = ''
        contractInfo.methods.forEach(m => {
            if (m.name === 'init') {
                r = r.replace(/@deploy/g, this._genDeployFunction(contractInfo, m))
            } else if (m.name !== 'accept') {
                functions += this._genFunction(contractInfo, m)
            }
        })
        return r.replace(/@functions/g, functions)
    }

    _genDeployFunction(contractInfo, methodInfo) {
        let r = String(fs.readFileSync(path.join(__dirname, '../../resource/templates/test/local_contract_deploy.txt')))
        return r.replace(/@contract/g, contractInfo.name)
            .replace(/@args_array/g, _genArgsArray(methodInfo.args))
            .replace(/@args/g, _genArgs(methodInfo.args))
    }

    _genFunction(contractInfo, methodInfo) {
        let r = String(fs.readFileSync(path.join(__dirname, '../../resource/templates/test/local_contract_function.txt')))
        return r.replace(/@contract/g, contractInfo.name)
            .replace(/@function/g, methodInfo.name)
            .replace(/@args_array/g, _genArgsArray(methodInfo.args))
            .replace(/@args/g, _genArgs(methodInfo.args))
    }
}


class Online {

    constructor(projectInfo) {
        this.projectInfo = projectInfo
    }

    gen() {
        this.projectInfo.contracts.forEach(c => {
            let content = this._genContract(c)
            let p = this._contractPath(c)
            Utils.checkAndMakeDir(p)
            fs.writeFileSync(p, content)
        })
    }

    _contractPath(contractInfo) {
        return path.join(this.projectInfo.workspace, 'test/contracts', contractInfo.name, 'online.js')
    }

    _genContract(contractInfo) {
        let r = String(fs.readFileSync(path.join(__dirname, '../../resource/templates/test/online_contract.txt')))
        r = r.replace(/@contract/g, contractInfo.name)
        let functions = ''
        contractInfo.methods.forEach(m => {
            if (m.name === 'init') {
                r = r.replace(/@deploy/g, this._genDeployFunction(contractInfo, m))
            } else if (m.name !== 'accept') {
                functions += this._genFunction(contractInfo, m)
            }
        })
        return r.replace(/@functions/g, functions)
    }

    _genDeployFunction(contractInfo, methodInfo) {
        let r = String(fs.readFileSync(path.join(__dirname, '../../resource/templates/test/online_contract_deploy.txt')))
        return r.replace(/@args_array/g, _genArgsArray(methodInfo.args))
            .replace(/@args/g, _genArgs(methodInfo.args))
    }

    _genFunction(contractInfo, methodInfo) {
        let r = String(fs.readFileSync(path.join(__dirname, '../../resource/templates/test/online_contract_function.txt')))
        return r.replace(/@function/g, methodInfo.name)
            .replace(/@args_array/g, _genArgsArray(methodInfo.args))
            .replace(/@args/g, _genArgs(methodInfo.args))
    }
}


class Generator {

    gen(projectInfo) {
        new Local(projectInfo).gen()
        new Online(projectInfo).gen()
    }
}


module.exports = new Generator()
