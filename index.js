'use strict'

const cheerio = require('cheerio')
const async = require('async')
const request = require('request').defaults({
  timeout: 5000
})

const colors = require('colors/safe')
const _url = require('url')
// const fs = require('fs')
const moment = require('moment')
moment.locale('ru')

const API_KEY = '55830a25cdfb7da183e04d2757e89ebb'
const API_SERVER_ENDPOINT = 'http://localhost:3001/project/create'

// Запускаем парсилку
let startPage = 1
let totalPages = 2

startParsing(startPage, onPageParsed)

function onPageParsed (err, result) {
  if (err) console.log(err)
  console.log('%d projects saved!', result.length)

  if (startPage < totalPages) {
    startPage++
    setTimeout(() => {
      startParsing(startPage, onPageParsed)
    }, 60000)
  }
}

// Step 0
function startParsing (startPage, callback) {
  async.waterfall([
    async.apply(loadPage, startPage),
    parsePage,
    loadProjects
  ], callback)
}

// Step 1
function loadPage (page, callback) {
  const url = getSearchUrl(page)
  console.log('loadPage', colors.blue(url))
  request(url, (err, res, body) => {
    if (err) return callback(err)
    if (res.statusCode !== 200) return callback(new Error(`${res.statusCode} ${res.statusMessage}`))
    callback(null, body)
  })
}

// Step 2
function parsePage (body, callback) {
  let $ = cheerio.load(body)
  let projects = $('body .container .row .project')
                  .map((i, el) => $(el).find('h5 a').attr('href'))
                  .toArray()
  callback(null, projects)
}

// Step 3
function loadProjects (projects, callback) {
  async.mapSeries(projects, fetchProject, callback)
}

// Step 3 / 1
// project = /npm/redux
function fetchProject (project, callback) {
  async.waterfall([
    async.apply(loadProject, project),
    saveProject
  ], callback)
}

// Step 3 / 2
function loadProject (path, callback) {
  const url = getProjectAPIUrl(path)
  request({url, json: true}, (err, res, body) => {
    if (err) return callback(err)
    if (res.statusCode !== 200) return callback(new Error(`${res.statusCode} ${res.statusMessage}`))
    callback(null, body)
  })
}

// Step 3 / 3
function saveProject (project, callback) {
  console.log('\n')
  console.log('Start saving project', colors.red(project.name))
  request.post(API_SERVER_ENDPOINT, {json: true, form: getProjectAttributes(project)}, (err, res, body) => {
    if (err) return callback(err)
    if (res.statusCode !== 200) return callback(new Error(`${res.statusCode} ${res.statusMessage}`))

    console.log('project created', body)
    callback(null, body)
  })
}

// Helpers

function getSearchUrl (page) {
  return _url.format({
    protocol: 'https',
    hostname: 'libraries.io',
    pathname: 'search',
    query: {
      order: 'desc',
      sort: 'rank',
      page
    }
  })
}

function getProjectAPIUrl (path) {
  return _url.format({
    protocol: 'https',
    hostname: 'libraries.io',
    pathname: `api${path}`,
    query: {
      api_key: API_KEY
    }
  })
}

function getProjectAttributes (project) {
  return {
    name: project.name,
    homepageUrl: project.homepage,
    repositoryUrl: project.repository_url,
    packageManagerUrl: project.package_manager_url,
    description: project.description,
    keywords: project.keywords.join(','),
    language: project.language,
    platform: project.platform,
    stars: project.stars,
    rank: project.rank
  }
}
