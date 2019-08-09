const fs = require('fs')
const path = require('path')
const storage = require('./local_storage.js').blockStorage
const Utils = require('./utils.js')


class LocalContractManager {

    constructor() {
        this._classes = {}
    }

    rigester(contract, address) {
        let name = Utils.contractName(contract)
        storage.setItem(this._addrKey(address), name)
        storage.setItem(this._nameKey(name), address)
    }

    getAddress(contract) {
        let name = Utils.contractName(contract)
        return storage.getItem(this._nameKey(name))
    }

    getClass(address) {
        let r = this._classes[address]
        if (!r) {
            let name = storage.getItem(this._addrKey(address))
            if (!name) {
                return null
            }
            let p = path.join(__dirname, '../src', name, 'main.js')
            if (!fs.existsSync(p)) {
                throw 'contract ' + name + ' not found.'
            }
            r = require(p)
            this._classes[address] = r
        }
        return r
    }

    _addrKey(address) {
        return '__contract__address__key__' + address
    }

    _nameKey(name) {
        return '__contracts__name__key__' + name
    }
}


module.exports = new LocalContractManager()
