'use strict'

// TODO: Надо все переделать на нормальное API
//       и не парсить нахуй эти ебучие HTML страницы
//       к тому же в списках оно отдает проекты целиком,
//       так что можно за один заход все сделать
//       а проджект воркер передалть чтобы он не все грабил а тока один проект
// https://libraries.io/api/search?api_key=55830a25cdfb7da183e04d2757e89ebb&order=desc&sort=rank&page=2

// Dependencies
const request = require('request').defaults({timeout: 5000})
const cheerio = require('cheerio')
const config = require('../config')
const colors = require('colors/safe')
const async = require('async')
const helpers = require('../utils/helpers')
const mongoose = require('../utils/mongoose')
const debug = require('debug')
const debugWorker = debug('app:worker')
const debugDb = debug('app:db')
const debugRequest = debug('app:request')

// Models
const Project = require('../models/project')

let totalPages = parseInt(config.total / config.perPage, 10)

module.exports.start = start

function start (page) {
  debugWorker('Start parsing. Page: %d of %d', page, totalPages)
  async.waterfall([
    async.constant(page),
    loadPage,
    saveData
  ], end)
}

function end (err, page, projects) {
  if (err) return console.log(err)
  debugWorker('End parsing. %d projects saved. Page: %d', projects.length, page)
  page++
  if (page < totalPages) start(page)
  else mongoose.connection.close(() => debugDb('Connection closed'))
}

function saveData (page, projects, next) {
  async.map(projects, createProject, (err, projects) => {
    projects.forEach(project => debugDb(colors.green('%s/%s') + ' saved', project.platform, project.name))
    next(err, page, projects)
  })
}

function createProject (project, callback) {
  let data = helpers.projectAttributeNormalizer(project)
  let query = {
    name: data.name,
    platform: data.platform
  }
  Project.findOneAndUpdate(query, data, {new: true, upsert: true, select: 'name platform'}, callback)
}

function loadPage (page, next) {
  async.retry(5, fetchPage(page), (err, projects) => {
    if (err) return next(null, page, [])
    next(null, page, projects)
  })
}

function fetchPage (page) {
  let url = helpers.getSearchUrl(page)
  return (callback, results) => {
    request({url, json: true}, (err, res, projects) => {
      if (err) return callback(err.message)
      if (res.statusCode !== 200) return callback(res.statusMessage)
      debugRequest(res.statusCode + ' ' + res.statusMessage + ' ' + url)
      callback(null, projects)
    })
  }
}
