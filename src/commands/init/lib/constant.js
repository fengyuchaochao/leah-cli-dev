const PROJECT_TEMPLATE_TYPE = {
  normal: 'normal',
  custom: 'custom',
};
const PROJECT_TEMPLATE_LIST = [
  {
    pkgName: 'leah-cli-dev-template-vue3',
    pkgVersion: '1.0.0',
    name: 'vue3标准模版',
    type: PROJECT_TEMPLATE_TYPE.normal,
    installCommand: 'npm install',
    startCommand: 'npm run serve'
  },
  {
    pkgName: 'leah-cli-dev-template-custom',
    pkgVersion: '1.0.0',
    name: 'vue3自定义模版',
    type: PROJECT_TEMPLATE_TYPE.custom,
  },
]

module.exports = {
  PROJECT_TEMPLATE_TYPE,
  PROJECT_TEMPLATE_LIST
};