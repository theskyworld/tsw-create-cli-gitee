import select from "@inquirer/select";
import chalk from "chalk";
import download from "download-git-repo";
import ora from "ora";
import path from "path";
import util from "util";
import { getTemplateList } from "./http.js";

class Generator {
  constructor(projectName, targetDir) {
    this.maxRequestTime = 15_000; // 最大请求时间
    this.projectName = projectName;
    this.targetDir = targetDir;
    // 对 download-git-repo 进行 promise 化改造
    this.download = util.promisify(download);
  }

  timeout() {
    return new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("request timeout")),
        this.maxRequestTime
      );
    });
  }

  // 创建模板项目
  async create() {
    try {
      // 1获取模板名称
      const choicedTemplate = await this.getChoicedTemplate();

      // 2下载模板到模板目录
      const res = await this.downloadTemplate(choicedTemplate)
      if (!res) return; // 下载失败直接返回
      // 3模板使用提示
      console.log(
        `\r\nSuccessfully created project ${chalk.cyan(this.projectName)}`
      );
      console.log(`\r\n  cd ${chalk.cyan(this.projectName)}`);
      console.log("  npm install");
      console.log("  git init");
      console.log("  npx husky install");
      console.log("  npm run dev");
      process.exit(0);
    } catch (err) {
      console.log(err);
    }
  }

  // 将ora加载loading动画与fn结合，实现调用fn的过程中显示loading
  /**
   *
   * @param {Function} fn 要执行的请求函数
   * @param {String} message 加载提示信息
   * @param  {...any} args 函数执行参数
   * @returns
   */
  async wrapLoadingWithFn(fn, message, ...args) {
    let isSuccess = false;
    const spinner = ora(message);
    // 开始加载动画
    spinner.start();

    try {
      // 加载成功
      const result = await Promise.race([fn(...args), this.timeout()]);
      spinner.succeed();
      isSuccess = true;
      return { isSuccess, result };
    } catch (err) {
      // 加载失败
      isSuccess = false;
      spinner.fail("clone failed, try again");
      process.exit(1);
    }
  }
  // 请求github上的项目模板，并返回用户选择的模板名称
  async getChoicedTemplate() {
    const { isSuccess, result: templateList } = await this.wrapLoadingWithFn(
      getTemplateList,
      "fetching template..."
    );
    if (!templateList) return;
    // 如果总共只有一个模板
    if (templateList.length === 1) {
      return templateList[0].name;
    } else {
      // 存在多个，则要求用户选择
      const templateNames = templateList.map(item => item.name);

      const choicedTemplate = await select({
        name: "choicedTemplate",
        message: "choose a template to create project",
        choices: templateNames.map(item => ({
          name: item,
          value: item,
        })),
      });

      return choicedTemplate;
    }
  }

  // 下载选择的模板名称对应的文件
  async downloadTemplate(template) {
    let res;
    // 拼接下载地址
    const requestUrl = `tsw-create-cli/${template}`;
    // 调用下载方法
    const { isSuccess } = await this.wrapLoadingWithFn(
      this.download, // 远程下载方法
      "waiting download template...", // 加载提示信息
      requestUrl, // 参数1: 下载地址
      path.resolve(process.cwd(), this.targetDir) // 参数2: 创建位置
    );
    res = isSuccess;
    return res;
  }
}

export default Generator;
