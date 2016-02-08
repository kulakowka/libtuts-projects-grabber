'use strict'

// Dependencies
const request = require('request').defaults({timeout: 5000})
const config = require('../config')
const colors = require('colors/safe')
const async = require('async')
const helpers = require('../utils/helpers')
const mongoose = require('../utils/mongoose')
const debug = require('debug')
const debugWorker = debug('app:worker:project')
const debugDbProjectFind = debug('app:db:project:find')
const debugDbProjectDeleted = debug('app:db:project:deleted')
const debugDbProjectUpdated = debug('app:db:project:updated')
const debugDbError = debug('app:db:error')
const debugDbSuccess = debug('app:db:success')
const debugRequestStart = debug('app:request:start')
const debugRequestSuccess = debug('app:request:success')
const debugRequestError = debug('app:request:error')

// Models
const Project = require('../models/project')

module.exports.start = function (startPage) {
  debugWorker('Start worker')
  getProjects(updateProjectsData)
}

function updateProjectsData (err, projects) {
  if (err) return debugDbError(err.message)
  if (!projects.length) {
    mongoose.connection.close(() => debugDbSuccess('Connection closed'))
    return debugWorker('All projects updated')
  }
  debugDbProjectFind('%d projects found', projects.length)
  async.mapSeries(projects, fetchAndUpdateProject, printResults)
}

function printResults (err, projects) {
  if (err) debugWorker(err.message, err)
  else debugWorker('%d projects updated', projects.length)
  getProjects(updateProjectsData)
}

function fetchAndUpdateProject (project, callback) {
  fetchProject(project, (err, json) => {
    if (err) return callback(err)
    if (!json) return callback(null)
    updateProject(project, json, callback)
  })
}

function fetchProject (project, callback) {
  const url = helpers.getProjectApiUrl(project)
  debugRequestStart('Start ' + colors.green('%s/%s') + ' project loading', project.platform, project.name)
  request({url, json: true}, (err, res, body) => {
    if (err) {
      debugRequestError(colors.red('Project ') + colors.green('%s/%s') + colors.red(' is not loaded'), project.platform, project.name)
      return callback(null, {isLoaded: true})
    }
    if (res && res.statusCode !== 200) {
      debugRequestError(colors.red('Project ') + colors.green('%s/%s') + colors.red(' is not loaded') + ' Server error: %d %s', project.platform, project.name, res.statusCode, res.statusMessage)
      return callback(null, {isLoaded: true})
    }

    debugRequestSuccess('Project ' + colors.green('%s/%s') + ' loaded', project.platform, project.name)
    callback(null, body)
  })
}

function updateProject (project, json, callback) {
  json = helpers.projectAttributeNormalizer(json)
  if (project.name !== json.name) {
    return Project.remove({_id: project._id}, (err) => {
      if (err) return callback(err)
      debugDbProjectDeleted('Project ' + colors.blue('%s/%s') + ' deleted', project.platform, project.name)
      callback(null, project)
    })
  }
  Project.findOneAndUpdate({_id: project._id}, json, {new: true, select: 'name platform'}, (err, project) => {
    if (err) return callback(err)
    debugDbProjectUpdated('Project ' + colors.blue('%s/%s') + ' updated', project.platform, project.name)
    callback(null, project)
  })
}

function getProjects (callback) {
  Project.find({isLoaded: {$ne: true}}).select('name platform').sort('-updatedAt').limit(config.perPage).exec(callback)
}
