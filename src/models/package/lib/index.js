'use strict';
const path = require('path');
const pkgDir = require('pkg-dir').sync;
const npmInstall = require('npminstall');
const pathExists = require('path-exists').sync;
const fse = require('fs-extra');

const { isObject } = require('@leah-cli-dev/utils');
const formatPath = require('@leah-cli-dev/format-path');
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require('@leah-cli-dev/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类初始化时，options参数不能为空！');
    }
    if (!isObject(options)) {
      throw new Error('Package类初始化时，options参数必须是对象');
    }
    const { targetPath, storeDir, packageName, packageVersion } = options;
    // package的路径
    this.targetPath = targetPath;
    // package的缓存路径
    this.storeDir = storeDir;
    // package的name
    this.packageName = packageName;
    // package的version
    this.packageVersion = packageVersion;
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }
  async prepare() {
    // 如果缓存目录不存在，需要手动创建
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === 'lasted') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }
  // 获取指定版本的package的缓存路径
  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    );
  }
  // 判断当前package是否存在
  async exists() {
    // 其实就是判断package的缓存路径，或者--targetPath指定的路径是否存在
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  // 安装package
  async install() {
    await this.prepare();
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }
  // 更新package
  async update() {
    await this.prepare();
    // 1. 获取最新的npm模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 2. 查询最新的版本号对应的缓存路径是否存在
    const latestCacheFilePath =
      this.getSpecificCacheFilePath(latestPackageVersion);
    // 3. 如果不存在，则直接安装最新版本
    if (!pathExists(latestCacheFilePath)) {
      await npmInstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [{ name: this.packageName, version: latestPackageVersion }],
      });
       // 安装了最新版本的package之后，记得更新当前package实例的packageVersion
      this.packageVersion = latestPackageVersion;
    } else {
      this.packageVersion = latestPackageVersion;
    }
   
  }
  // 获取入口文件路径
  getRootFilePath() {
    const _getRootFile = (targetPath) => {
      // 1. 获取package.json所在目录 - pkg-dir
      const dir = pkgDir(targetPath);
      if (dir) {
        // 2. 读取package.json - require()
        const pkgFile = require(path.resolve(dir, 'package.json'));
        // 3. 获取main/lib属性对应的path
        if (pkgFile && pkgFile.main) {
          // 4. 路径的兼容（macOS/windows
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath)
    } else {
      return _getRootFile(this.targetPath)
    }
  }
}

module.exports = Package;
