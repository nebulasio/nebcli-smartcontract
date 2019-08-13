const fs = require('fs')
const path = require('path')
const Utils = require('../util/utils.js')


class MainGenerator {

    constructor(projectInfo, isOnline) {
        this.projectInfo = projectInfo
        this.isOnline = isOnline
    }

    gen() {
        let p = path.join(this.projectInfo.workspace, 'test', (this.isOnline ? 'online_main.js' : 'local_main.js'))
        Utils.checkAndMakeDir(p)
        let b = false
        let r = this._genRequire()
        let lines = null
        if (fs.existsSync(p)) {
            lines = String(fs.readFileSync(p)).trim().split('\n')
        } else {
            let s = this.isOnline ?
                '../../resource/templates/test/online_main.txt' :
                '../../resource/templates/test/local_main.txt'
            lines = String(fs.readFileSync(path.join(__dirname, s))).trim().split('\n')
        }
        lines.forEach(line => {
            if (b) {
                r += line + '\n'
            } else {
                if (line.startsWith('/** Automatically generated code; End. */')) {
                    b = true
                }
            }
        })
        fs.writeFileSync(p, r)
    }

    _genRequire() {
        let s = '/** Automatically generated code, please do not modify. */\n'
        this.projectInfo.contracts.forEach(c => {
            if (this.isOnline) {
                s += "const " + c.name + " = require('./contracts/" + c.name + "/online.js').testnet\n"
                s += "const " + c.name + "Mainnet = require('./contracts/" + c.name + "/online.js').mainnet\n"
            } else {
                s += "const " + c.name + " = require('./contracts/" + c.name + "/local.js')\n"
            }
        })
        s += '/** Automatically generated code; End. */\n'
        return s
    }
}


class Generator {

    gen(projectInfo) {
        new MainGenerator(projectInfo, true).gen()
        new MainGenerator(projectInfo, false).gen()
    }

}


module.exports = new Generator()