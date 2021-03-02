const core = require('@actions/core');
const got = require('got');
const { default: ForEach } = require('apr-for-each');
const github = require('@actions/github');
const { join } = require('path');
const { format } = require('url');

const createDeploymentStatus = require('./create-deployment-status');


module.exports = async ({ repo, owner, environment }) => {

};