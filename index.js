'use strict'

const schedule = require('node-schedule')
const cheerio = require('cheerio')
const async = require('async')
const request = require('request')
const colors = require('colors/safe')
const _url = require('url')
const fs = require('fs')
const moment = require('moment')
moment.locale('ru')

const API_KEY = '55830a25cdfb7da183e04d2757e89ebb'
const API_SERVER_ENDPOINT = 'http://localhost:3001/project'

const requests_mer_minute = 60
const projects_per_page = 30
const total_projects = 1130690 
const total_pages = parseInt(total_projects / projects_per_page, 10)
const complete_date_all_projects = moment().add(total_pages, 'minutes').format('MMMM Do YYYY, h:mm:ss')
const total_duration_for_all_projects = moment().add(total_pages, 'minutes').fromNow()

// сколько хотим загрузить проектов
const projects_to_load = 60
const pages_to_load = parseInt(projects_to_load / projects_per_page, 10)
const complete_date_for_some_projects = moment().add(pages_to_load, 'minutes').fromNow()
// За одну минут я могу:
// 1. Запросить одну страницу из списка
// 2. Поочереди загрузить все проекты с помощью API. 

// получаетсяя по 30 проектов в минуту 


// console.log('Всего проектов:', colors.green(total_projects))
// console.log('Проектов на странице:', colors.green(projects_per_page))
// console.log('Всего страниц пагинатора:', colors.green(total_pages))
// console.log('Лимит запросов к API:', colors.red(`${requests_mer_minute} req/min`))
// console.log('')
// console.log(colors.blue('Рассчитаем время загрузки для всех проектов'))
// console.log('За одну минуту мы можем загрузить:', colors.green(' 1 страницу из пагинатора и 30 проектов'))
// console.log('Получается наша скорость:', colors.green(' 30 проектов в минуту'))
// console.log('Все проекты будут загружены:', colors.red(total_duration_for_all_projects))
// console.log('Расчетная дата завершения:', colors.red(complete_date_all_projects))
// console.log('')
// console.log(colors.blue(`Рассчитаем время для загрузки ${projects_to_load} проектов`))
// console.log('Необходимо будет загрузить:', colors.red(`${pages_to_load} страниц пагинатора`))
// console.log('Расчетная дата завершения:', colors.red(complete_date_for_some_projects))

// Запускаем парсилку
let startPage = 1
let totalPages = 10

startParsing(startPage, (err, result) => {
  if (err) console.log(err)
  console.log('result', result)
})


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
  request(getSearchUrl(page), (err, res, body) => {
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
  
  request.post(API_SERVER_ENDPOINT, {form: getProjectAttributes(project)}, (err, res, body) => {
    if (err) return callback(err)
    if (res.statusCode !== 200) return callback(new Error(`${res.statusCode} ${res.statusMessage}`))
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







