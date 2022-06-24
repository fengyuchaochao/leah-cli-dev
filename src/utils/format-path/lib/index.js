'use strict';

const path = require('path');

// 兼容macOS和windows的路径，因为不同系统的路径分隔符可能不同。
function formatPath(p) {
  if (p) {
    const sep = path.sep;
    if (sep === '/') {
      return p;
    } else {
      return p.replace(/\\/g, '/');
    }
  }
  return p;
}

module.exports = formatPath;
