const NebUtil = require('./neb_util.js').mainnet
const Logger = require('./logger.js')

class HashCheker {

    constructor(hash) {
        this._logger = new Logger("NETWORK")
        this._hash = hash
    }

    check() {
        return new Promise((resolve) => {
            this._resolve = resolve
            this._check()
        })
    }

    async _check() {
        this.result = await NebUtil.getTxResult(this._hash)
        if (!this.result || this.result.status === 2) {
            if (!this.result) {
                this._logger.d('getTxResult failed.')
            }
            setTimeout(() => {
                this._check()
            }, 5000);
        } else {
            this._resolve(this.result.status === 1)
        }
    }
}

module.exports = HashCheker
