const CP = require('child_process')


class ProcessUtil {

    constructor() {
    }

    execAsync(cmd, options) {
        return new Promise((resolve) => {
            CP.exec(cmd, options, (error, stdout, stderr) => {
                resolve({ error: error, stdout: stdout, stderr: stderr })
            })
        })
    }

    execSync(cmd, options) {
        return CP.execSync(cmd, options)
    }
}


module.exports = new ProcessUtil()