#! /usr/bin/env node

import { program } from "commander";
import require from "./bin/utils/useRequire.js";

// require的路径值应当相对于useRequire.js文件的路径进行填写
program.name("tsw").version(`v${require("../../package.json").version}`); // 配置动态版本号

// tsw create
program
  .command("create")
  .argument("[project-name]", "optional project name")
  .description("create a project")
  .option("-f, --force", "force to overwrite target directory if it exists")
  .action(async (projectName, options) => {
    const createProject = (await import("./lib/createProject.js")).default;
    createProject(projectName, options);
  });

program.parse(process.argv);