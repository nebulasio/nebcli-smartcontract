const fse = require('fs-extra')
const path = require('path')
const Linq = require('linq')
const PU = require('../util/process_util.js')
const Utils = require('../util/utils.js')
const ProjectInfo = require('../common/project_info.js')


class Initializer {

    init(workspace, contracts) {
        this.workspace = workspace
        this.contracts = contracts
        this._copyTemplate()
        this._initContracts()
        return this._npmInstall()
    }

    add(workspace, contracts) {
        Utils.checkRoot(workspace)
        this.workspace = workspace
        this.contracts = contracts
        this._checkContracts(contracts)
        this._initContracts()
    }

    _checkContracts(contracts) {
        let projectInfo = new ProjectInfo(this.workspace)
        contracts.forEach(c => {
            if (projectInfo.contains(c)) {
                throw 'contract ' + c + ' repeated.'
            }
        })
    }

    _copyTemplate() {
        let cs = fse.readdirSync(this.workspace)
        let count = Linq.from(cs).count(s => !s.startsWith('.'))
        if (count > 0) {
            throw this.workspace + ' is not empty.'
        }
        let src = path.join(__dirname, '../../resource/templates/project')
        fse.copySync(src, this.workspace)
    }

    _initContracts() {
        if (!this.contracts || this.contracts.length == 0) {
            return
        }
        this.contracts.forEach(c => this._initContract(c))
    }

    _initContract(name) {
        let t = String(fse.readFileSync(path.join(__dirname, '../../resource/templates/contract/contract.txt')))
        let dst = path.join(this.workspace, 'src', name, 'main.js')
        Utils.checkAndMakeDir(dst)
        t = t.replace(/@contract/g, name)
        fse.writeFileSync(dst, t)
    }

    _npmInstall() {
        console.log('npm install start...')
        let r = PU.execSync('npm install', { cwd: this.workspace })
        console.log('stdout: ' + r)
        console.log('npm install end')
    }
}


module.exports = new Initializer()
