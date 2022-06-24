const path = require('path');

const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const commander = require('commander');

const log = require('@leah-cli-dev/log');
const exec = require('@leah-cli-dev/exec');

const pkg = require('../package.json');
const constant = require('./constant.js');

let args;
const program = new commander.Command();

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (err) {
    log.error(err.message);
    // 只有在调试模式下，才输出完整错误信息
    if (program.opts().debug) {
      console.log(err);
    }
  }
}

async function prepare() {
  checkPkgVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

// 检测脚手架版本号
function checkPkgVersion() {
  log.info('当前版本为：', pkg.version);
}

// 检测root账户
function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
}
// 检测用户主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登陆用户主目录不存在！'));
  }
}
// 检测环境变量
function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  if (pathExists(dotenvPath)) {
    // dotenv默认加载的是当前文件夹下的.env文件，这里推荐将.env文件保存在用户主目录下，因此这里手动指定path
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
  log.verbose('环境变量', process.env.username);
}
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig['cliHome'];
  return cliConfig;
}
// 检测是否为最新版本
async function checkGlobalUpdate() {
  // 1. 获取当前版本
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  // 2. 调用npm API，获取所有版本号
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本
  // 4. 然后根据所有大于当前版本列表，获取最新版本
  const { getNpmSemverVersions } = require('@leah-cli-dev/get-npm-info');
  const lastVersions = await getNpmSemverVersions(npmName);
  // 5. 比较当前版本和最新版本
  if (lastVersions && semver.gt(lastVersions, currentVersion)) {
    log.warn(
      colors.yellow(
        `推荐更新 ${npmName}，当前版本：${currentVersion}, 最新版本：${lastVersions}, 您可以执行：npm install -g ${npmName} 更新至最新版本`
      )
    );
  }
}

// 注册命令
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);

  // 监听targetPath，并且保存在全局环境变量中
  program.on('option:targetPath', () => {
    const { targetPath } = program.opts();
    process.env.CLI_TARGET_PATH = targetPath;
  });

  // 监控：是否输入了--debug命令
  program.on('option:debug', () => {
    const { debug } = program.opts();
    if (debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
    log.verbose('已开启debug模式');
  });

  // 监控未知命令，给出友好提示
  program.on('command:*', (obj) => {
    console.log(`未知的命令：${obj[0]}`);
    const availableCommands = program.commands.map((cmd) => cmd.name());
    console.log(`可用命令：`, availableCommands.join(','));
  });
  // 当用户没有输入任何子命令时，输出文档提示
  // if (program.args?.length < 1) {
  //   program.outputHelp();
  //   console.log();
  // }

  program.parse(process.argv);
}

module.exports = core;
