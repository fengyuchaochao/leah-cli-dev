'use strict';

const semver = require('semver');
const colors = require('colors');

const log = require('@leah-cli-dev/log');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    if (!argv) throw new Error('Command初始化时，argv参数不能为空！');
    if (!Array.isArray(argv)) throw new Error('Command初始化时，argv参数类型必须为数组！')
    if (argv.length < 1) throw new Error('Command初始化时，命令参数不能为空');
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
        let chain = Promise.resolve();
        chain = chain.then(() => this.checkNodeVersion());
        chain = chain.then(() => this.initArgs());
        chain = chain.then(() => this.init());
        chain = chain.then(() => this.exec());
        chain.catch(err => {
            log.error(err.message);
        })
    })
  }
  // 检测node最低版本
  checkNodeVersion() {
    // 1. 获取当前系统的node版本
    const currentVersion = process.version;
    // 2. 获取node最低版本限制
    const lowestVersion = LOWEST_NODE_VERSION;
    // 3. 如果系统版本小于node最低版本限制，则要报错提示
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`leah-cli-dev 需要安装 v${lowestVersion} 以上版本的 Node.js`)
      );
    }
  }
  // 解析参数argv
  initArgs() {
    this.cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, -1);
  }
  init() {
    throw new Error('init方法，子类必须实现');
  }
  exec() {
    throw new Error('exec方法，子类必须实现');
  }
}

module.exports = Command;
