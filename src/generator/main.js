const KeyGen = require('./keys_generator')
const Utils = require('../util/utils.js')
const ProjectInfo = require('../common/project_info')
const TestContractGenerator = require('./test_contract_generator.js')
const TestMainGenerator = require('./test_main_generator.js')
const ConfigGenerator = require('./config_generator.js')
const LaunchGenerator = require('./launch_generator.js')


class Generator {

    gen(workspace) {
        Utils.checkRoot(workspace)
        let projectInfo = new ProjectInfo(workspace)
        KeyGen.gen(projectInfo, 10)
        TestContractGenerator.gen(projectInfo)
        TestMainGenerator.gen(projectInfo)
        ConfigGenerator.gen(projectInfo)
        LaunchGenerator.gen(projectInfo)
    }

}


module.exports = new Generator()
