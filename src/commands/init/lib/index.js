'use strict';
const inquirer = require('inquirer');

const log = require('@leah-cli-dev/log');

function init(projectName, options, cmdObj) {
  inquirer
    .prompt([
      // input类型
      {
        type: 'input',
        name: 'name',
        message: 'your name:',
        default: 'default name',
        // validate: (v) => {
        //   return v === 'kobe';
        // },
        // transformer: (v) => {
        //   return `(${v})input your name`;
        // },
        // filter: (v) => {
        //   return `name[${v}]`
        // }
      },
      // number类型：表示输入的数据必须是可以转成number类型，否则为NaN
      {
        type: 'number',
        name: 'age',
        message: 'your age:'
      },
      // confirm类型：一般用于二选一，yes or no
      {
        type: 'confirm',
        name: 'gender',
        message: 'are you man',
        default: false
      },
      // list类型与rawlist类型：两者都是单选，只是展现形式上略有不同
      // checkbox类型：多选
      {
        type: 'checkbox',
        name: 'hobbies',
        message: 'your hobbies',
        choices: [
          {value: 1, name: 'basketball'},
          {value: 2, name: 'football'},
          {value: 3, name: 'dance'},
        ]
      },
      // expand类型：一般用于简写的时候，即用户输入简写，结果是其对应的实际值。
      {
        type: 'expand',
        name: 'color',
        message: 'your color',
        default: 'red',
        choices: [
          {key: 'r', value: 'red'},
          {key: 'g', value: 'yellow'},
          {key: 'b', value: 'green'},
        ]
      },
      // password类型
      {
        type: 'password',
        name: 'password',
        message: 'your password:'
      },
      // editor类型：相对于input而言，editor可以输入更复杂的内容
      {
        type: 'editor',
        name: 'content',
        message: 'your content:',
      }
    ])
    .then((answer) => {
      console.log(answer);
    });
}

module.exports = init;
