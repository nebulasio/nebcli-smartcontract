#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const nebdev = require('../index')

function list(val) {
    return val.split(',')
}

function getPath(v) {
    if (v.startsWith('/')) {
        return v
    }
    return path.join(process.cwd(), v)
}

program
    .command('init <contract> [otherContracts...]')
    .description('init project.')
    .action((contract, otherContracts) => {
        nebdev.init(process.cwd(), [contract].concat(otherContracts))
    })

program
    .command('add <contract> [otherContracts...]')
    .description('add contracts.')
    .action((contract, otherContracts) => {
        nebdev.add(process.cwd(), [contract].concat(otherContracts))
    })

program
    .command('build')
    .description('build project.')
    .action(() => {
        nebdev.build(process.cwd())
    })

program
    .command('deploy <network>')
    .description('deploy contracts.')
    .action((network) => {
        if (nebdev.build(process.cwd())) {
            nebdev.deploy(process.cwd(), network)
        }
    })

program
    .command('generate')
    .alias('gen')
    .description('generate test code.')
    .action(() => {
        nebdev.build(process.cwd())
        nebdev.generate(process.cwd())
    })

program
    .command('key <path>')
    .alias('keystore')
    .description('print keystore info.')
    .action((path) => {
        nebdev.printKeystore(getPath(path))
    })

program.parse(process.argv)
