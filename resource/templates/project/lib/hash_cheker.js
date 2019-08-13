const NebUtil = require('./neb_util.js')
const Logger = require('./logger.js')

class HashCheker {

    constructor(hash, isMainnet) {
        this._logger = new Logger("NETWORK")
        this._hash = hash
        this.nebUtil = isMainnet ? NebUtil.mainnet : NebUtil.testnet
    }

    check() {
        return new Promise((resolve) => {
            this._resolve = resolve
            setTimeout(() => { this._check() }, 17000);
        })
    }

    async _check() {
        this.result = await this.nebUtil.getTxResult(this._hash)
        if (!this.result || this.result.status === 2) {
            if (!this.result) {
                this._logger.d('getTxResult failed.')
            }
            setTimeout(() => {
                this._check()
            }, 5000)
        } else {
            this._resolve(this.result.status === 1)
        }
    }
}

module.exports = HashCheker
