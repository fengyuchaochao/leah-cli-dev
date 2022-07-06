const path = require('path');
const cp = require('child_process');

const Package = require('@leah-cli-dev/package');
const log = require('@leah-cli-dev/log');
const {exec: spawn} = require('@leah-cli-dev/utils');

const SETTINGS = {
  init: '@leah-cli-dev/init',
};
const CACHE_DIR = 'dependencies';

async function exec(...argv) {
  let pkg;
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  let storeDir;
  const cmdObj = argv[argv.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'lasted';

  // 如果用户没有手动指定npm包的路径，则自动从缓存中读取
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });

    const isExists = await pkg.exists();
    if (isExists) {
      // 更新package
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    try {
			const cmd = argv[argv.length - 1];
			// cmd对象内部有很多内部属性和原型属性，我们此处可以对其进行过滤瘦身
			const obj = {};
			Object.keys(cmd).forEach(key => {
				if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
					obj[key] = cmd[key];
				}
			})
			argv[argv.length - 1] = obj;
			const code = `require('${rootFile}').call(null, ${JSON.stringify(argv)})`;
			// 创建子进程，在子进程中执行入口文件
			const childProcess = spawn('node', ['-e', code], {
				cwd: process.cwd(),
				stdio: 'inherit'
			});
			childProcess.on('error', () => {
				log.error(e.message);
				process.exit(1); // 1表示命令执行失败
			})
			childProcess.on('exit', (e) => {
				log.verbose('命令执行完成：' + e);
				process.exit(e) // 0表示命令执行成功
			})
    } catch (e) {
      log.error(e.message);
    }
  }
}

module.exports = exec;
