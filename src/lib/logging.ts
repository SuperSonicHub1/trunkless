// winston is not browser compatible

import winston from "winston"
import Transport from "winston-transport"
import type { Store } from "tinybase/store"
import type { Id } from "tinybase/common"

// class TinyBaseTransport extends Transport {
// 	private store: Store
// 	private tableId: Id

// 	constructor(opts) {
// 		super(opts)
// 		this.store = opts.store
// 		this.tableId = opts.tableId
// 	}

// 	log(info, callback) {
// 		queueMicrotask(() => this.emit('logged', info))

// 		this.store.addRow(this.tableId, )

// 		if (callback) queueMicrotask(() => callback())
// 	}
// }

const logger = winston.createLogger({
	level: 'debug',
	format: winston.format.json(),
	transports: [
		new winston.transports.Console({
			// format: winston.format.simple(),
		})
	]
})

logger.log('info', 'aaaaaaaaa')

export default logger
