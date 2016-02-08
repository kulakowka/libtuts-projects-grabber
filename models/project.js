'use strict'

const mongoose = require('../utils/mongoose')

const Schema = mongoose.Schema

const schema = new Schema({
  name: {
    type: String,
    lowercase: true,
    required: true,
    trim: true
  },
  language: {
    type: String,
    lowercase: true,
    trim: true
  },
  platform: {
    type: String,
    lowercase: true,
    required: true,
    trim: true
  },
  homepageUrl: {
    type: String,
    trim: true
  },
  repositoryUrl: {
    type: String,
    trim: true
  },
  packageManagerUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  keywords: {
    type: [String],
    lowercase: true,
    trim: true
  },
  stars: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  isLoaded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
})

schema.index({ name: 1, platform: 1 }, { unique: true })

// schema.path('keywords').set(keywords => keywords.split(','))

module.exports = mongoose.model('Project', schema)
