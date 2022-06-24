const path = require('path');

const Package = require('@leah-cli-dev/package');
const log = require('@leah-cli-dev/log');

const SETTINGS = {
	init: '@leah-cli-dev/init'
};
const CACHE_DIR = 'dependencies'

async function exec(...params) {
	let pkg;
	let targetPath = process.env.CLI_TARGET_PATH;
	const homePath = process.env.CLI_HOME_PATH;
	log.verbose('targetPath', targetPath);
	log.verbose('homePath', homePath);

	let storeDir;
	const cmdObj = params[params.length - 1];
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
			packageVersion
		});
		
		const isExists = await pkg.exists()
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
			packageVersion
		});
	}
	const rootFile = pkg.getRootFilePath();
	console.log(rootFile);
	if (rootFile) {
		require(rootFile)(...params);
	}
}

module.exports = exec;
