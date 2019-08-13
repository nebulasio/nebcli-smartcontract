const fs = require('fs')
const path = require('path')


class LocalStorage {

    constructor(filePath) {
        this._filePath = filePath
        let dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        this._saveHandle = null
    }

    get _map() {
        if (!this.__map) {
            let s = fs.existsSync(this._filePath) ? String(fs.readFileSync(this._filePath, { encoding: 'utf8' })) : null
            if (s) {
                this.__map = JSON.parse(s)
            }
        }
        if (!this.__map) {
            this.__map = {}
        }
        return this.__map
    }

    set _map(value) {
        this.__map = value
        this._svae()
    }

    _svae() {
        if (this._saveHandle != null) {
            clearTimeout(this._saveHandle)
        }
        this._saveHandle = setTimeout(() => {
            fs.writeFileSync(this._filePath, JSON.stringify(this._map), { encoding: 'utf8' })
        }, 10)
    }

    get allItems() {
        return this._map
    }

    getItem(key) {
        return this._map[key]
    }

    setItem(key, value) {
        this._map[key] = value
        this._svae()
    }

    removeItem(key) {
        delete this._map[key]
        this._svae()
    }

    clear() {
        this._map = {}
    }
}


const contractStorages = {}

module.exports = {

    blockStorage: new LocalStorage(path.join(__dirname, '../test/data/block_chain.data')),

    contractStorage: function (name) {
        let storage = contractStorages[name]
        if (!storage) {
            storage = new LocalStorage(path.join(__dirname, '../test/data/contract_' + name + '.data'))
            contractStorages[name] = storage
        }
        return storage
    }
}
