const path = require('path')
const fs = require('fs')
const ContractInfo = require('./contract_info')
const Linq = require('linq')

class ProjectInfo {

    constructor(workspace) {
        this.workspace = workspace
        this.contracts = []
        let src = path.join(workspace, 'src')
        let dirs = Linq.from(fs.readdirSync(src)).where(f => !f.startsWith('.')).toArray()
        dirs.forEach(d => {
            let p = path.join(src, d)
            let c = path.join(p, 'main.js')
            if (this._isContract(p)) {
                this.contracts.push(new ContractInfo(c))
            } else {
                if (!d.startsWith('.')) {
                    console.log(c, 'not found.')
                }
            }
        })
        this._checkRepeat()
    }

    contains(contract) {
        return Linq.from(this.contracts).any(c => c.name.toLowerCase() === contract.toLowerCase())
    }

    _isContract(dir) {
        let p = path.join(dir, 'main.js')
        return fs.existsSync(p) && fs.statSync(p).isFile
    }

    _checkRepeat() {
        let d = Linq.from(this.contracts)
        let names = d.select(c => c.name.toLowerCase()).toArray()
        names.forEach(n => {
            if (d.count(c => c.name.toLowerCase() === n) > 1) {
                throw 'contract ' + n + ' repeated.'
            }
        })
    }
}

module.exports = ProjectInfo
