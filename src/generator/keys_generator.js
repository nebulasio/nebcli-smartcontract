const path = require('path')
const fs = require('fs-extra')
const nebulas = require("nebulas")
const Utils = require('../util/utils.js')

const NebAccount = nebulas.Account


class Generator {

    _newKey() {
        return NebAccount.NewAccount().getPrivateKeyString()
    }

    gen(projectInfo, count) {
        Utils.checkRoot(projectInfo.workspace)
        let p = path.join(projectInfo.workspace, 'test/data/keys.json')
        if (fs.existsSync(p)) {
            return
        }
        Utils.checkAndMakeDir(p)

        if (!count) {
            count = 5
        }
        let keys = []
        for (let i = 0; i < count; i++) {
            keys.push(this._newKey())
        }

        let r = {
            deployer: this._newKey(),
            caller: this._newKey(),
            otherKeys: keys
        }

        fs.writeFileSync(p, JSON.stringify(r, null, 2))
    }

}

module.exports = new Generator()