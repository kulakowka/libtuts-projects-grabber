'use strict'

const mongoose = require('./utils/mongoose')
const SearchWorker = require('./workers/search')
const ProjectWorker = require('./workers/project')
const debug = require('debug')('app:db')

mongoose.connection.once('open', function () {
  debug('Connected to database')

  // Start parsing search pages one by one
  let page = 1
  SearchWorker.start(page)

  // Start fetching project info from API
  // ProjectWorker.start()
})
