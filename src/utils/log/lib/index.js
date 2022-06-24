'use strict';

const log = require('npmlog');

// 根据是否开启debug模式，来控制是否输出日志
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
// 修改前缀
log.heading = 'leah-cli-dev';
// 自定义模式
log.addLevel('success', 2000, { fg: 'green', bold: true });

module.exports = log;
