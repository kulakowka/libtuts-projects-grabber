'use strict'

const mongoose = require('mongoose')
let config = require('../config')

mongoose.connect(config.mongodbUrl)

module.exports = mongoose
