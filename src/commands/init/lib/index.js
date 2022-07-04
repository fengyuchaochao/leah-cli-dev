'use strict';
const inquirer = require('inquirer');

const log = require('@leah-cli-dev/log');
const Command = require('@leah-cli-dev/command');

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    console.log(this.cmd);
    log.verbose('projectName', this.projectName);
  }
  exec() {
    console.log('init具体业务逻辑!!!')
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
