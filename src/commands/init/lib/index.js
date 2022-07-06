'use strict';
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');

const log = require('@leah-cli-dev/log');
const Command = require('@leah-cli-dev/command');
const Package = require('@leah-cli-dev/package');
const { spinnerStart, sleep, execAsync } = require('@leah-cli-dev/utils');

const { PROJECT_TEMPLATE_TYPE, PROJECT_TEMPLATE_LIST } = require('./constant');

// 命令白名单，防止一些恶意命令被执行
const WHITE_COMMAND = ['npm', 'cnpm'];

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    log.verbose('projectName', this.projectName);
  }
  async exec() {
    try {
      // 1. 准备阶段
      this.projectInfo = await this.prepare();
      if (this.projectInfo) {
        log.verbose('projectInfo', this.projectInfo);
        // 2. 下载模版
        await this.downloadTemplate();
        // 3. 安装模版
        await this.installTemplate();
      }
    } catch (err) {
      log.error(err.message);
    }
  }
  async prepare() {
    // 0. 判断项目模版是否存在
    const template = PROJECT_TEMPLATE_LIST;
    if (!template || template.length === 0) {
      throw new Error('项目模版不存在');
    }
    this.template = template;
    // 1. 判断当前目录是否为空
    const localPath = process.cwd();
    if (!this.isDirEmpty(localPath)) {
      let isContinue = false;
      if (!this.cmd.force) {
        // 询问用户是否继续创建项目
        const ret = await inquirer.prompt({
          type: 'confirm',
          name: 'isContinue',
          default: false,
          message: '当前文件夹不为空，继续创建项目？',
        });
        isContinue = ret.isContinue;
        if (!isContinue) return;
      }
      // 2. 判断是否启动强制更新
      if (isContinue || this.cmd.force) {
        // 清空当前目录，且清空前需要给用户做二次确认
        const { isConfirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'isConfirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件？',
        });
        if (isConfirmDelete) {
          fse.emptyDirSync(localPath);
        }
      }
    }
    // 3. 选择创建模版或组件
    // 4. 获取项目的基本信息
    return await this.getProjectInfo();
  }
  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(
      (item) => item.pkgName === projectTemplate
    );
    this.templateInfo = templateInfo;
    const { pkgName, pkgVersion } = templateInfo;
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, 'template');
    const storeDir = path.resolve(
      process.env.CLI_HOME_PATH,
      'template',
      'node_modules'
    );
    const templatePkg = new Package({
      targetPath,
      storeDir,
      packageName: pkgName,
      packageVersion: pkgVersion,
    });

    if (await templatePkg.exists()) {
      const spinner = spinnerStart('正在更新模版中...');
      await sleep();
      try {
        await templatePkg.update();
      } catch (err) {
        throw err;
      } finally {
        spinner.stop(true);
        if (await templatePkg.exists()) {
          log.success('模版更新成功');
          this.templatePkg = templatePkg;
        }
      }
    } else {
      const spinner = spinnerStart('正在下载模版中...');
      await sleep();
      try {
        await templatePkg.install();
      } catch (err) {
        throw err;
      } finally {
        spinner.stop(true);
        if (await templatePkg.exists()) {
          log.success('模版下载成功');
          this.templatePkg = templatePkg;
        }
      }
    }
  }
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = PROJECT_TEMPLATE_TYPE.normal;
      }
      if (this.templateInfo.type === PROJECT_TEMPLATE_TYPE.normal) {
        // 标准安装
        await this.installNormalTemplate();
      } else if (
        this.templateInfo.type === PROJECT_TEMPLATE_TYPE.custom
      ) {
        // 自定义安装
        await this.installCustomTemplate();
      } else {
        throw new Error('项目模版类型无法识别');
      }
    } else {
      throw new Error('项目模版信息不存在');
    }
  }
  async installNormalTemplate() {
    // 1. 将缓存中的模版代码拷贝至当前目录
    const spinner = spinnerStart('正在安装模版...');
    try {
      const templatePath = path.resolve(
        this.templatePkg.cacheFilePath,
        'template'
      );
      const targetPath = process.cwd();
      fse.ensureDirSync(templatePath); // 确保目录在使用前存在，如果没有，则会自动创建
      fse.ensureDirSync(targetPath);

      fse.copySync(templatePath, targetPath);
    } catch (err) {
      throw err;
    } finally {
      spinner.stop(true);
      log.success('模版安装成功')
    }
    // 2. 安装依赖
    const {installCommand, startCommand} = this.templateInfo;
    await this.execCommand(installCommand, '依赖安装失败！')
    // 3. 启动服务
    await this.execCommand(startCommand, '启动服务失败')
  }
  async installCustomTemplate() {
    if (await this.templatePkg.exists()) {
      const rootFile = this.templatePkg.getRootFilePath();
      if (fs.existsSync(rootFile)) {
        const options = {
          templateInfo: this.templateInfo,
          sourcePath: templatePath,
          targetPath: process.cwd()
        };
        const code = `require('${rootFile}')(${JSON.stringify(options)})`;
        execAsync('node', ['-e', code], {stdio: 'inherit', cwd: process.cwd()})
      } else {
        throw new Error('自定义模版入口文件不存在！')
      }
    }
  }
  isDirEmpty(path) {
    let fileList = fs.readdirSync(path);
    // 过滤掉以.开头的文件以及node_modules文件，因为这些文件本身不影响项目的初始化
    fileList = fileList.filter((file) => {
      return file.startsWith('.') || ['node_modules'].indexOf(file) < 0;
    });
    return !fileList || fileList.length <= 0;
  }
  async getProjectInfo() {
    let projectInfo = {};
    const isValidProjectName = (name) => {
      return name && /^(@[a-zA-Z0-9-_]+\/)?[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(name)
    }
    const projectPrompt = [];
    if (!isValidProjectName(this.projectName)) {
      projectPrompt.push(...[
        {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        validate: function (val) {
          const done = this.async();
          setTimeout(function () {
            if (!isValidProjectName(val)) {
              done('请输入合法的项目版本号！');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: (v) => v,
      },
      ])
    } else {
      projectInfo.projectName = this.projectName;
    }
    projectPrompt.push(...[
      {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本号',
        default: '1.0.0',
        validate: function (val) {
          const done = this.async();
          setTimeout(function () {
            if (!!!semver.valid(val)) {
              done('请输入合法的项目版本号！');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: (val) => {
          if (!!semver.valid(val)) {
            return semver.valid(val);
          } else {
            return val;
          }
        },
      },
      {
        type: 'list',
        name: 'projectTemplate',
        message: '请选择项目类型',
        choices: function () {
          return PROJECT_TEMPLATE_LIST.map((item) => ({
            value: item.pkgName,
            name: item.name,
          }));
        },
      },
    ])

    const project = await inquirer.prompt(projectPrompt);
    projectInfo = { ...projectInfo, ...project };
    console.log(projectInfo);
    return projectInfo;
  }
  checkCommand(cmd) {
    return WHITE_COMMAND.includes(cmd) ? cmd : null;
  }
  async execCommand(command, errMsg) {
    let result;
    if (command) {
      const cmdArr = command.split(' ');
      const cmd = this.checkCommand(cmdArr[0]);
      if (!cmd) {
        throw new Error(`${cmdArr[0]} 命令不存在！`)
      }
      const args = cmdArr.slice(1);
      result = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
    if (result !== 0) {
      throw new Error(errMsg);
    }
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
