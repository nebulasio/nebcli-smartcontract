const fs = require('fs-extra')
const path = require('path')
const Linq = require('linq')
const readline = require('readline')

class Utils {

    projectTemplateVersion(workspace) {
        let p = path.join(workspace, 'nebconfig.json')
        if (!fs.existsSync(p)) {
            return null
        }
        return JSON.parse(String(fs.readFileSync(p))).version
    }

    checkRoot(workspace) {
        if (!this.projectTemplateVersion(workspace)) {
            throw workspace + ' is not the root directory of the nebulas contract project.'
        }
    }

    checkContract(contractInfo) {
        let hasInit = Linq.from(contractInfo.methods).any(m => m.name === 'init')
        if (!hasInit) {
            throw contractInfo.name + ' did not find the init method.'
        }
    }

    checkAndMakeDir(filePath) {
        let dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirpSync(dir)
        }
    }

    isEmptyString(str) {
        return !str || str.trim().length === 0
    }

    argsFromConfig(argsCfg) {
        if (argsCfg instanceof Array) {
            return argsCfg
        }
        let r = []
        for (k in argsCfg) {
            r.push(argsCfg[k])
        }
        return r
    }

    readInput(question) {
        return new Promise((resolve) => {
            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(question, function (answer) {
                resolve(answer)
                rl.close();
            });
            rl.on("close", function () {
            });
        })
    }

    readPwd(question) {
        return new Promise((resolve) => {
            if (question) {
                process.stdout.write(question);
            }
            var stdin = process.stdin;
            stdin.resume();
            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding('utf8');

            var password = '';
            stdin.on('data', function (ch) {
                ch = ch.toString('utf8');

                switch (ch) {
                    case "\n":
                    case "\r":
                    case "\u0004":
                        // They've finished typing their password
                        process.stdout.write('\n');
                        stdin.setRawMode(false);
                        stdin.pause();
                        resolve(password)
                        break;
                    case "\u0003":
                        // Ctrl-C
                        resolve(password)
                        break;
                    case String.fromCharCode(127):
                        password = password.slice(0, password.length - 1);
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(question);
                        process.stdout.write(password.split('').map(function () {
                            return '*';
                        }).join(''));
                        break;
                    default:
                        // More passsword characters
                        process.stdout.write('*');
                        password += ch;
                        break;
                }
            });
        })
    }
}

module.exports = new Utils()