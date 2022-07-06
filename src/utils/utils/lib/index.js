'use strict';

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function spinnerStart(msg = '加载中...') {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner(`${msg} %s`);
  spinner.setSpinnerString('|/-\\');
  spinner.start();
  return spinner;
}

function sleep(timeout = 1000){
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  })
}

function exec(command, args, options) {
  const cp = require('child_process');

	const win32 = process.platform === 'win32';
	const cmd = win32 ? 'cmd' : command;
	const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

	return cp.spawn(cmd, cmdArgs, options || {})
}

function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options);
    p.on('error', reject);
    p.on('exit', resolve);
  })
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync
};
