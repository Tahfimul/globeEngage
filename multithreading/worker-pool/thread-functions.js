'use strict'

const WorkerPool = require('workerpool')
const Utilities = require('../2-utilities')

// MIDDLEWARE FUNCTIONS
const bcryptHash = (password) => {
  console.log("calling cryptHash from thread functions");	
  return Utilities.bcryptHash(password)
}

const runChildProcess = () => {
	return Utilities.runChildProcess()
}

// CREATE WORKERS
console.log("creating worker");
WorkerPool.worker({
	bcryptHash
})
