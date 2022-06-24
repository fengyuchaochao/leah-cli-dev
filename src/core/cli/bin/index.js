#!/usr/bin/env node

'use strict';

const importLocal = require('import-local');

const log = require('@leah-cli-dev/log');
const utils = require('../../../utils/utils/lib');

const core = require('../lib');

if (importLocal(__filename)) {
  log.info('cli', '正在使用 leah-cli-dev 本地版本');
} else {
  core();
}
