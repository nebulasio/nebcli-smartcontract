const readline = require('readline')
const path = require('path')
const fs = require('fs')

class Utils {

    contractName(contract) {
        if (!contract) {
            throw 'contract is null.'
        }
        if (typeof (contract) === 'string') { // ContractName
            return contract
        }
        if (contract.__contractName) {
            return contract.__contractName
        }
        let cls = null
        if (contract.__contractClass) { // TestContract
            cls = contract.__contractClass
        } else { // ContractClass
            cls = contract
        }
        return new cls().__contractName
    }

    getConfigPath(cfgFolderPath, value) {
        if (!value) {
            return null
        }
        if (value.startsWith('/')) {
            return value
        }
        return path.join(cfgFolderPath, value)
    }

    readInput(question) {
        return new Promise((resolve) => {
            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })
            rl.question(question, function (answer) {
                resolve(answer)
                rl.close()
            })
            rl.on("close", function () {
            })
        })
    }

    readPwd(question) {
        return new Promise((resolve) => {
            if (question) {
                process.stdout.write(question)
            }
            var stdin = process.stdin
            stdin.resume()
            stdin.setRawMode(true)
            stdin.resume()
            stdin.setEncoding('utf8')

            var password = ''
            stdin.on('data', function (ch) {
                ch = ch.toString('utf8')

                switch (ch) {
                    case "\n":
                    case "\r":
                    case "\u0004":
                        // They've finished typing their password
                        process.stdout.write('\n')
                        stdin.setRawMode(false)
                        stdin.pause()
                        resolve(password)
                        break
                    case "\u0003":
                        // Ctrl-C
                        resolve(password)
                        break
                    case String.fromCharCode(127):
                        password = password.slice(0, password.length - 1)
                        process.stdout.clearLine()
                        process.stdout.cursorTo(0)
                        process.stdout.write(question)
                        process.stdout.write(password.split('').map(function () {
                            return '*'
                        }).join(''))
                        break
                    default:
                        // More passsword characters
                        process.stdout.write('*')
                        password += ch
                        break
                }
            })
        })
    }

    checkAndMakeDir(filePath) {
        let dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    trim(str, s) {
        str = str.trim()
        while (str.startsWith(s)) {
            str = str.substr(s.length, str.length - s.length)
        }
        while (str.endsWith(s)) {
            str = str.substr(str.length - s.length, s.length)
        }
        return str
    }

    isEmpty(s) {
        return !s || s.trim().length === 0
    }
}

module.exports = new Utils()
