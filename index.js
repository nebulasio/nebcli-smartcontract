const fs = require('fs')
const NebAccount = require('nebulas').Account
const Generator = require('./src/generator/main.js')
const Initializer = require('./src/init/main.js')
const Build = require('./src/build/main.js')
const Deploy = require('./src/deploy/main.js')
const Utils = require('./src/util/utils.js')


module.exports = {

    init: function (workspace, contractNames) {
        // try {
        Initializer.init(workspace, contractNames)
        console.log('init complete.')
        return true
        // } catch (e) {
        //     console.log('init error: ' + e)
        //     return false
        // }
    },

    add: function (workspace, contractNames) {
        // try {
        Initializer.add(workspace, contractNames)
        Generator.gen(workspace)
        console.log('add complete.')
        return true
        // } catch (e) {
        //     console.log('init error: ' + e)
        //     return false
        // }
    },

    build: function (workspace) {
        // try {
        Build.build(workspace)
        console.log('build complete.')
        return true
        // } catch (e) {
        //     console.log('build error: ' + e)
        //     return false
        // }
    },

    generate: function (workspace) {
        // try {
        Generator.gen(workspace)
        console.log('generate complete.')
        return true
        // } catch (e) {
        //     console.log('generate error: ' + e)
        //     return false
        // }
    },

    deploy: async function (workspace, contracts) {
        // try {
        await new Deploy(workspace).oneKeyDeploy(contracts)
        console.log('deploy complete.')
        return true
        // } catch (e) {
        //     console.log('deploy error: ' + e)
        //     return false
        // }
    },

    printKeystore: async function (keystorePath) {
        let a = NebAccount.NewAccount()
        if (!fs.existsSync(keystorePath)) {
            console.log(keystorePath + ' not found.')
            return
        }
        let pwd = await Utils.readPwd('password:')
        a.fromKey(String(fs.readFileSync(keystorePath)), pwd, false)
        console.log('address:', a.getAddressString())
        console.log('privateKey:', a.getPrivateKeyString())
    }
}