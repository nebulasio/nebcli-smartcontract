const BigNumber = require('bignumber.js')
const nebulas = require('nebulas')
const Neb = nebulas.Neb
const HttpRequest = nebulas.HttpRequest
const NebUtils = nebulas.Utils
const NebTransaction = nebulas.Transaction
const Logger = require('./logger.js')

class NebUtil {

    constructor(isMainnet) {
        this._logger = new Logger('NETWORK')
        if (!isMainnet) {
            this.chainId = 1001
            this.server = "https://testnet.nebulas.io"
        } else {
            this.chainId = 1
            this.server = "https://mainnet.nebulas.io"
        }
        this.neb = new Neb(new HttpRequest(this.server))
    }

    async callTest(from, contractAddress, value, method, args) {
        let contract = {
            "source": "",
            "sourceType": "js",
            "function": method,
            "args": JSON.stringify(args),
            "binary": "",
            "type": "call"
        }
        return await this._call(from, contractAddress, value, contract)
    }

    async deployTest(from, source, args) {
        let contract = {
            "source": source,
            "sourceType": "js",
            "args": JSON.stringify(args)
        }
        return await this._call(from, from, 0, contract)
    }

    getAccountInfo(address) {
        return new Promise((resolve) => {
            let info = {}
            let self = this
            return self.neb.api.getAccountState(address)
                .then(resp => {
                    info.balance = resp.balance
                    info.nonce = parseInt(resp.nonce) + 1
                    info.gasPrice = '20000000000'
                    resolve(info)
                    // return self.neb.api.gasPrice()
                })
                // .then(resp => {
                //     info.gasPrice = NebUtils.toBigNumber(resp.gas_price).toString(10)
                //     resolve(info)
                // })
                .catch(e => {
                    throw e
                })
        })
    }

    async genTransferData(from, to, value) {
        let accountInfo = await this.getAccountInfo(from)
        // if (!accountInfo) {
        //     return null
        // }
        let gasLimit = "10000000" //await this._estimateTransferGas(from, to, value)
        // if (!gasLimit) {
        //     return null
        // }
        return {
            chainId: this.chainId,
            from: from,
            to: to,
            value: value,
            nonce: accountInfo.nonce,
            gasPrice: accountInfo.gasPrice,
            gasLimit: gasLimit,
        }
    }

    async genDeploySignData(from, source, args) {
        let accountInfo = await this.getAccountInfo(from).catch(e => {
            this._logger.e(e)
        })
        // if (!accountInfo) {
        //     return null
        // }
        let gasLimit = '10000000'
        // let gasLimit = await this._estimateDeployGas(from, source, args)
        // if (!gasLimit) {
        //     return null
        // }
        return {
            chainId: this.chainId,
            from: from,
            to: from,
            value: 0,
            nonce: accountInfo.nonce,
            gasPrice: accountInfo.gasPrice,
            gasLimit: gasLimit,
            contract: {
                "source": source,
                "sourceType": "js",
                "args": JSON.stringify(args)
            }
        }
    }

    async genCallSignData(from, contractAddress, value, func, args) {
        let accountInfo = await this.getAccountInfo(from)
        // if (!accountInfo) {
        //     return null
        // }
        let gasLimit = '10000000'
        // let gasLimit = await this._estimateCallGas(from, contractAddress, value, func, args)
        // if (!gasLimit) {
        //     return null
        // }
        return {
            chainId: this.chainId,
            from: from,
            to: contractAddress,
            value: value,
            nonce: accountInfo.nonce,
            gasPrice: accountInfo.gasPrice,
            gasLimit: gasLimit,
            contract: {
                "source": "",
                "sourceType": "js",
                "function": func,
                "args": JSON.stringify(args),
                "binary": "",
                "type": "call"
            }
        }
    }

    sign(account, data) {
        if (account.getAddressString() !== data.from) {
            this._logger.e('签名账号与发送者地址不一至')
            return null
        }
        try {
            let tx = new NebTransaction(
                data.chainId,
                account,
                data.to,
                data.value,
                data.nonce, data.gasPrice, data.gasLimit, data.contract
            )
            tx.signTransaction()
            return tx.toProtoString()
        } catch (e) {
            this.Logger.e(e)
            return null
        }
    }

    sendRowTransaction(data) {
        let self = this
        return new Promise((resolve) => {
            this.neb.api.sendRawTransaction(data).then(r => {
                resolve(r)
            }).catch(e => {
                self._logger.e(e)
                throw e
            })
        })
    }

    async oneKeyTransfer(account, toAddress, value) {
        let data = await this.genTransferData(account.getAddressString(), toAddress, value)
        if (data == null) {
            return null
        }
        let signData = await this.sign(account, data)
        if (!signData) {
            return null
        }
        return await this.sendRowTransaction(signData)
    }

    async oneKeyDeploy(account, source, args) {
        let data = await this.genDeploySignData(account.getAddressString(), source, args)
        if (data == null) {
            return null
        }
        let signData = await this.sign(account, data)
        if (!signData) {
            return null
        }
        return await this.sendRowTransaction(signData)
    }

    async oneKeyCall(account, contractAddress, value, func, args) {
        let data = await this.genCallSignData(account.getAddressString(), contractAddress, value, func, args)
        if (data == null) {
            return null
        }
        let signData = await this.sign(account, data)
        if (!signData) {
            return null
        }
        return await this.sendRowTransaction(signData)
    }

    async getTxResult(txHash) {
        let self = this
        return new Promise((resolve) => {
            this.neb.api.getTransactionReceipt(txHash).then(function (resp) {
                resolve(resp)
            }).catch(function (err) {
                self._logger.e(err)
                resolve(null)
            })
        })
    }

    async _estimateTransferGas(from, to, value) {
        let self = this
        return new Promise((resolve) => {
            this.neb.api.estimateGas({
                from: from,
                to: to,
                value: value,
                nonce: 0,
                gasPrice: "20000000000",
                gasLimit: "10000000",
            }).then(r => {
                resolve(new BigNumber(r.gas).plus(10000).toString(10))
            }).catch(e => {
                self._logger.e(e)
                resolve(null)
            })
        })
    }

    async _estimateDeployGas(from, source, args) {
        let r = await this.deployTest(from, source, args)
        if (r.estimate_gas) {
            return new BigNumber(r.estimate_gas).plus(10000).toString(10)
        } else {
            return null
        }
    }

    async _estimateCallGas(from, contractAddress, value, func, args) {
        let r = await this.callTest(from, contractAddress, value, func, args)
        if (r.estimate_gas) {
            return new BigNumber(r.estimate_gas).plus(10000).toString(10)
        } else {
            return null
        }
    }

    _call(from, to, value, contract) {
        let self = this
        return new Promise((resolve) => {
            this.neb.api.call({
                from: from,
                to: to,
                value: value,
                nonce: 0,
                gasPrice: "20000000000",
                gasLimit: "10000000",
                contract: contract
            }).then(r => {
                resolve(r)
            }).catch(e => {
                self._logger.e(e)
                resolve(null)
            })
        })
    }
}


NebUtil.testnet = new NebUtil(false)
NebUtil.mainnet = new NebUtil(true)


module.exports = NebUtil
