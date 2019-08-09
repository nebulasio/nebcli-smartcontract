const fs = require('fs')
const path = require('path')
const Utils = require('../util/utils.js')


class LaunchGenerator {
    gen(projectInfo) {
        let p = path.join(projectInfo.workspace, '.vscode/launch.json')
        if (fs.existsSync(p)) {
            return
        }
        Utils.checkAndMakeDir(p)
        fs.copyFileSync(path.join(__dirname, '../../resource/templates/test/launch.txt'), p)
    }
}


module.exports = new LaunchGenerator()
