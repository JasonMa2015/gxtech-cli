#!/usr/bin/env node
// 使用node开发命令行工具所执行的Javascript脚本必须在顶部加入 #!/usr/bin/env node 声明

const program = require('commander')
const download = require('download-git-repo')
const handlebars = require('handlebars') // 模板引擎处理字符串
const inquirer = require('inquirer')
const fs = require('fs')
const ora = require('ora')
const chalk = require('chalk')
const logSymbols = require('log-symbols')

const templates = require('./templateConfig')

// 1.获取用户输入命令
program
  .version('1.0.0')  // -v 或者 --version 的时候会输出该版本号

// jm init a a-name
// 基于a模板进行初始化

// jm init b b-name
// 基于b模板进行初始化
program
  .command('init <template> <project>')
  .description('初始化项目模板')
  .action(function (templateNane, projectNane) {
    // 根据模板名下载对应的模板到本地
    // 下载之前做 loading 提示
    const spinner = ora('正在下载模板...')
    spinner.start()
    
    /**
     * 第一个参数: 仓库地址
     * 第二个参数: 下载路径 
     */
    const { downloadUrl } = templates[templateNane]
    download(downloadUrl, projectNane, { clone: true }, (err) => {
      if (err) {
        spinner.fail('下载模板失败') // 下载失败提示
        console.log(logSymbols.error, chalk.red('初始化模板失败' + err))
        return false;
      }

      spinner.succeed('下载模板成功') // 下载成功提示

      // 把项目下的 package.json 文件读取出来
      // 使用向导的方式采集用户输入的值
      // 使用模板引擎吧用户输入的数据解析到 package.json 文件中
      // 解析完毕，把解析之后的结果重新写入 package.json 文件中
      inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: '请输入项目名称:'
      }, {
        type: 'input',
        name: 'description',
        message: '请输入项目简介:'
      }, {
        type: 'input',
        name: 'author',
        message: '请输入作者名称:'
      }]).then((answers) => {
        // 把采集到的用户输入的数据解析替换到 package.json 文件中
        const packagePath = `${projectNane}/package.json`
        const packageContent = fs.readFileSync(packagePath, 'utf8')
        const packageResult = handlebars.compile(packageContent)(answers)
        fs.writeFileSync(packagePath, packageResult)
        console.log(logSymbols.success, chalk.yellow('初始化模板成功'))
      })
    })
  });

program
  .command('list')
  .description('查看所有可用模板')
  .action(() => {
    // 根据模板名下载对应的模板到本地并起名projectName
    console.log('模板列表：')
    for (let key in templates) {
      console.log(`${templates[key].name} ${templates[key].description}`)
    }
  });

program.parse(process.argv);
