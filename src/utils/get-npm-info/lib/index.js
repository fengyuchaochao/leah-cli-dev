'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

// 获取npm指定包的基本信息
function getNpmInfo(npmName, registry) {
  if (!npmName) return;
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  return axios
    .get(npmInfoUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      }
      return null;
    })
    .catch((err) => Promise.reject(err));
}
function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? 'https://registry.npmjs.org'
    : 'https://mirrors.tencent.com/npm/';
}

// 获取npm指定包的所有版本
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

// 获取比较之后符合条件的version
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `^{baseVersion}`))
    .sort((a, b) => semver.gt(b, a));
}

// 获取npm指定包中，符合条件的version
async function getNpmSemverVersions(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = getSemverVersions(baseVersion, versions);
  if (newVersions?.length > 0) return newVersions[0];
  return null;
}
// 获取npm指定包的最新版本
async function getNpmLatestVersion(npmName, registry) {
  let versions = await getNpmVersions(npmName, registry);
  return versions ? versions.sort((a, b) => semver.gt(b, a)) : null;
}

module.exports = {
  getNpmSemverVersions,
  getDefaultRegistry,
  getNpmLatestVersion
};
