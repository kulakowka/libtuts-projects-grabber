'use strict'

const mongoose = require('./utils/mongoose')
const SearchWorker = require('./workers/search')
// const ProjectWorker = require('./workers/project')
const debug = require('debug')('app:db')
const program = require('commander')

program
  .version('0.0.1')
  .option('-p, --page [number]', 'Start from page [number]. Default: 1', 1)
  .parse(process.argv)

mongoose.connection.once('open', function () {
  debug('Connected to database')

  // Start parsing search pages one by one
  SearchWorker.start(program.page)

  // Start fetching project info from API
  // ProjectWorker.start()
})
