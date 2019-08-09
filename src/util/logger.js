class Logger {
    constructor(tag) {
        this.tag = tag
    }

    d(...args) {
        let t = '[' + this.tag + '] D:'
        Reflect.apply(console.log, null, [t].concat(args))
    }

    e(...args) {
        let t = '[' + this.tag + '] E:'
        Reflect.apply(console.log, null, [t].concat(args))
    }
}


Logger.d = function (tag, ...args) {
    let logger = new Logger(tag)
    Reflect.apply(logger.d, logger, args)
}


Logger.e = function (tag, ...args) {
    let logger = new Logger(tag)
    Reflect.apply(logger.e, logger, args)
}


module.exports = Logger
