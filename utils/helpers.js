'use strict'

const config = require('../config')

module.exports.getSearchUrl = function (page) {
  return `https://libraries.io/api/search?order=desc&sort=rank&page=${page}`
}

module.exports.getProjectApiUrl = function (project) {
  return `https://libraries.io/api/${encodeURIComponent(project.platform)}/${encodeURIComponent(project.name)}?api_key=${config.librariesio.apiKey}`
}

module.exports.projectAttributeNormalizer = function (project) {
  return {
    name: project.name && project.name.toLowerCase(),
    homepageUrl: project.homepage,
    repositoryUrl: project.repository_url,
    packageManagerUrl: project.package_manager_url,
    description: project.description,
    keywords: project.keywords && project.keywords.map(k => k && k.toLowerCase()),
    language: project.language && project.language.toLowerCase(),
    platform: project.platform && project.platform.toLowerCase(),
    stars: project.stars,
    rank: project.rank,
    isLoaded: true
  }
}
