const path = require('path')
const Utils = require('../util/utils.js')


class Deploy {

    constructor(workspace) {
        Utils.checkRoot(workspace)
        this.workspace = workspace
    }

    async deploy(network) {
        if (['mainnet', 'testnet'].indexOf(network.toLowerCase()) < 0) {
            throw 'network error: ' + network
        }
        let isMainnet = network.toLowerCase() === 'mainnet'
        let DeployManager = require(path.join(this.workspace, 'lib/deploy_manager.js'))
        let dm = isMainnet ? DeployManager.mainnet : DeployManager.testnet
        await dm.deploy()
    }
}


module.exports = Deploy