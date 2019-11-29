const LocalStorage = require('./local_storage')
const LocalContractManager = require('./local_contract_manager.js')
const Utils = require('./utils.js')
const nebulas = require("nebulas")
const BigNumber = require('bignumber.js')
const NebAccount = nebulas.Account
const NebUtils = nebulas.Utils
const NebCryptoUtils = nebulas.CryptoUtils

const blockStorage = LocalStorage.blockStorage


class MapStorage {

    constructor(localStorage, keyPrefix, serializer, deserializer) {
        this.storage = localStorage
        this.keyPrefix = keyPrefix + "_"
        this.serializer = serializer
        this.deserializer = deserializer
    }

    _key(key) {
        return this.keyPrefix + key
    }

    get(key) {
        let s = this.storage.getItem(this._key(key))
        if (s == null || typeof s === 'undefined') {
            return null
        }
        return this.deserializer(s)
    }

    set(key, value) {
        if (typeof value === 'undefined') {
            value = null
        }
        this.storage.setItem(this._key(key), this.serializer(value))
    }

    put(key, value) {
        this.set(key, value)
    }

    del(key) {
        this.storage.removeItem(this._key(key))
    }
}


const NasBalance = new MapStorage(blockStorage, "__NEBULAS_BALANCE", function (val) {
    if (val.toString) {
        return val.toString(10)
    } else {
        return "" + val
    }
}, function (val) {
    if (!val) {
        return new BigNumber(0)
    }
    return new BigNumber(val)
})

function getBalance(address) {
    let r = NasBalance.get(address)
    if (r == null) {
        r = new BigNumber(0)
    }
    return r
}


const LocalContext = {

    _transactions: [],

    transfer: function (from, to, val) {
        let senderIsUser = LocalContractManager.getClass(from) == null
        let toClass = LocalContractManager.getClass(to)
        let receiverIsContract = toClass != null
        if (!from) {
            if (receiverIsContract) {
                throw 'cannot add nas to the contract.'
            }
        } else {
            if (!senderIsUser) {
                throw 'contract cannot be the sender.'
            }
        }
        if (senderIsUser && receiverIsContract) {
            this._callContract(from, to, val, 'accept', [])
        } else {
            this._transfer(from, to, val)
        }
    },

    _transfer: function (from, to, val) {
        val = new BigNumber(val)
        if (from) {
            let b = getBalance(from)
            if (val.gt(b)) {
                throw ("Insufficient balance")
            }
            b = b.sub(val)
            NasBalance.set(from, b)
        }
        this._addNas(to, val)
    },

    getBalance: function (address) {
        return getBalance(address)
    },

    getContractAddress: function (contract) {
        return LocalContractManager.getAddress(contract)
    },

    clearData: function () {
        blockStorage.clear()
    },

    set blockHeight(height) {
        if (height <= this._blockHeight) {
            throw '"height" needs to be greater than the current block height.'
        }
        this._blockHeight = height
        blockStorage.setItem("__block", height + "")
    },

    get blockHeight() {
        if (!this._blockHeight) {
            let h = blockStorage.getItem("__block")
            if (h) {
                this._blockHeight = parseInt(h)
            } else {
                this._blockHeight = 0
            }
        }
        return this._blockHeight
    },

    _callContract: function (from, contract, value, func, args) {
        this._pushTransaction(this._newTransaction(from, contract, value))
        this._transfer(from, contract, value)
        try {
            let c = new BlockContract(contract).contract
            if (!c[func]) {
                throw c.__contractName + '.' + func + ' not found.'
            }
            let r = c[func].apply(c, args)
            return r
        } catch (e) {
            this._transfer(contract, from, value)
            console.log(e)
            throw e
        } finally {
            this._popTransaction()
        }
    },

    _deploy: function (from, contract, args) {
        let name = Utils.contractName(contract)
        let address = NebAccount.NewAccount().getAddressString()
        LocalContractManager.rigester(name, address)
        LocalStorage.contractStorage(name).clear()
        return this._callContract(from, address, 0, 'init', args)
    },

    _addNas: function (address, val) {
        let b = getBalance(address)
        b = b.plus(val)
        NasBalance.set(address, b)
    },

    _pushTransaction: function (tx) {
        this._transactions.push(tx)
    },

    _popTransaction: function () {
        if (this._transactions.length <= 0) {
            throw ("no transactions")
        }
        let tx = this._transactions[this._transactions.length - 1]
        this._transactions = this._transactions.slice(0, this._transactions.length - 1)
        return tx
    },

    _newTransaction(from, to, value) {
        return {
            from: from,
            to: to,
            value: new BigNumber(value),
            gasPrice: 0,
            gasLimit: 0
        }
    },
}


class BlockContract {

    constructor(address) {
        this.address = address
        this.amount = new BigNumber(0)
        let clz = this._getContract(address)
        if (!clz) {
            throw ("contract " + address + " not found.")
        }
        this.contract = new clz()
    }

    value(amount) {
        this.amount = new BigNumber(amount)
        return this
    }

    call() {
        let tx = LocalContext._newTransaction(Blockchain.transaction.to, this.address, this.amount)
        LocalContext._pushTransaction(tx)
        LocalContext._transfer(tx.from, tx.to, this.amount)
        try {
            let a = Array.from(arguments)
            return this.contract[a[0]].apply(this.contract, a.slice(1, a.length))
        } catch (e) {
            LocalContext._transfer(this.address, Blockchain.transaction.to, this.amount)
            throw e
        } finally {
            LocalContext._popTransaction()
        }
    }

    _getContract(address) {
        let c = LocalContractManager.getClass(address)
        if (!c) {
            throw ("Did not find contract " + address)
        }
        return c
    }
}

function _defaultParse(text) {
    if (!text) {
        return null
    }
    return JSON.parse(text)
}

function _defaultStringify(o) {
    return JSON.stringify(o)
}


/******************************************************************************
 */

const LocalContractStorage = {

    defineProperty: function (obj, name, serializer) {
        let storage = LocalStorage.contractStorage(obj.__contractName)
        Object.defineProperty(obj, name, {
            get: function () {
                let r = storage.getItem(name)
                if (r == null || typeof r === 'undefined') {
                    return null
                }
                if (serializer && serializer.parse) {
                    r = serializer.parse(storage.getItem(name))
                } else {
                    r = _defaultParse(storage.getItem(name))
                }
                return r
            },
            set: function (val) {
                if (typeof val === 'undefined') {
                    val = null
                }
                if (serializer && serializer.stringify) {
                    val = serializer.stringify(val)
                } else {
                    val = _defaultStringify(val)
                }
                storage.setItem(name, val)
            },
            configurable: true
        })
    },

    defineProperties: function (obj, properties) {
        for (let n in properties) {
            this.defineProperty(obj, n, properties[n])
        }
    },

    defineMapProperty: function (obj, n, serializer) {
        let storage = LocalStorage.contractStorage(obj.__contractName)
        if (serializer) {
            obj[n] = new MapStorage(storage, n, serializer.stringify, serializer.parse)
        } else {
            obj[n] = new MapStorage(storage, n, _defaultStringify, _defaultParse)
        }
    },

    defineMapProperties: function (obj, mapProperties) {
        for (let n in mapProperties) {
            this.defineMapProperty(obj, n, mapProperties[n])
        }
    }
}


const Blockchain = {

    Contract: BlockContract,

    get transaction() {
        if (LocalContext._transactions.length === 0) {
            throw ("no transactions")
        }
        return LocalContext._transactions[LocalContext._transactions.length - 1]
    },

    get block() {
        return {
            get timestamp() {
                return LocalContext.blockHeight * 15
            },
            get height() {
                return LocalContext.blockHeight
            }
        }
    },

    transfer: function (address, val) {
        LocalContext._transfer(Blockchain.transaction.to, address, val)
        return true
    },

    verifyAddress: function (address) {
        if (NebAccount.isValidAddress(address, 87)) {
            return 87
        }
        if (NebAccount.isValidAddress(address, 88)) {
            return 88
        }
        return 0
    },

    getAccountState: function (address) {
        return {
            balance: getBalance(address).toString(10),
            nonce: 0
        }
    },
}

const Event = {
    Trigger: function (key, value) {
        console.log('[contract trigger] key:' + JSON.stringify(key) + " value:" + JSON.stringify(value))
    }
}

module.exports = {
    LocalContractStorage: LocalContractStorage,
    Blockchain: Blockchain,
    Event: Event,
    LocalContext: LocalContext
}

