import input from "@inquirer/input";
import select from "@inquirer/select";
import fs from "fs-extra";
import path from "path";
import Generator from "./generator.js";

function doCreate(projectName, targetDir) {
  // 创建项目
  // 逻辑为根据用户选择的模板文件夹来创建
  const generator = new Generator(projectName, targetDir);

  // 开始创建项目
  generator.create();
}

/**
 *
 * @param {string} name  项目名
 * @param {object} options 命令选项
 * @returns
 */
export default async function createProject(name, options) {
  let projectName = name;
  // 如果一开始没有输入项目名
  if (!projectName) {
    // 在这里向用户询问项目名
    projectName = await input({
      message: "project name:",
      default: "my-app",
    });
  }
  // 当前命令行的执行目录
  const cwd = process.cwd();
  // 项目的创建目录
  const targetDir = path.join(cwd, projectName);

  // 如果已存在目标目录
  // 则如果选择强制创建，则移除后新建
  // 如果没有选择强制创建，则询问用户是否强制创建
  // 如果没有存在目标目录
  // 则直接新建

  if (fs.existsSync(targetDir)) {
    // 已存在目标目录
    if (options && options.force) {
      // 选择强制创建
      // 移除目标目录
      await fs.remove(targetDir);
      doCreate(projectName, targetDir);
    } else {
      // 询问用户是否强制创建
      const isForce = await select({
        name: "isForce",
        message: "Target directory exists. Do you want to continue?",
        choices: [
          // 强制创建
          {
            name: "Overwrite",
            value: "overwrite",
          },
          // 退出创建
          {
            name: "Cancel",
            value: false,
          },
        ],
      });
      if (isForce) {
        async function confirmRemove() {
          const noRemoveAnswers = ["no", "n", "nope", "quit", "false", "exit"];
          // 强制创建
          // 创建前提示用户将删除已有的目标目录
          const isRemove = await input({
            message:
              "This will remove the existing directory. Type yes to continue.",
          });
          // 先确定退出移除已存在目录的逻辑，然后剩下的都是继续移除
          // 退出移除的逻辑为匹配"no" | "n" | "nope" | "quit"其中一个值时
          if (
            // 用户选择取消移除
            noRemoveAnswers.includes(String(isRemove))
          ) {
            console.log("canceled with no remove");
            return;
            // 用户未输入任何内容
          } else if (String(isRemove) === "") {
            // 继续进行询问
            await confirmRemove();
          } else {
            // 用户选择移除目标目录
            console.log("removing target directory...");
            // 移除目标目录
            await fs.remove(targetDir);
            doCreate(projectName, targetDir);
          }
        }
        await confirmRemove();
      } else {
        console.log("cancelled with no force");
        // 取消创建
        return;
      }
    }
  } else {
    doCreate(projectName, targetDir);
  }
}
