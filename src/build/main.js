const fs = require('fs-extra')
const path = require('path')
const Utils = require('../util/utils.js')
const ProjectInfo = require('../common/project_info.js')


class Build {

    build(workspace) {
        Utils.checkRoot(workspace)
        this.projectInfo = new ProjectInfo(workspace)
        this._check()
        this.projectInfo.contracts.forEach(c => this._build(c));
    }

    _check() {
        this.projectInfo.contracts.forEach(c => Utils.checkContract(c))
    }

    _build(contract) {
        let sp = path.join(this.projectInfo.workspace, 'src', contract.name, 'main.js');
        let dp = path.join(this.projectInfo.workspace, 'build', 'output', contract.name + '.js');

        let r = ''
        let lines = String(fs.readFileSync(sp)).split('\n')
        let b = false
        lines.forEach(line => {
            if (b) {
                r += line + '\n'
            } else {
                if (line.startsWith('/** Local simulation environment code; End. */')) {
                    b = true
                }
            }
        })
        Utils.checkAndMakeDir(dp)
        fs.writeFileSync(dp, r.trim() + '\n')
    }
}


module.exports = new Build()
