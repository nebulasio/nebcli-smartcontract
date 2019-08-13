const fs = require('fs')
const path = require('path')
const Linq = require('linq')
const NebAccount = require('nebulas').Account


class TestKeys {

    constructor() {
        let p = path.join(__dirname, '../test/data/keys.json')
        if (!fs.existsSync(p)) {
            throw 'not found ' + p
        }
        let d = JSON.parse(String(fs.readFileSync(p)))
        this.deployer = this._newAccount(d.deployer)
        this.caller = this._newAccount(d.caller)
        this.otherKeys = Linq.from(d.otherKeys).select(k => this._newAccount(k)).toArray()
    }

    _newAccount(key) {
        let a = NebAccount.NewAccount()
        a.setPrivateKey(key)
        return a
    }

}


module.exports = new TestKeys()
