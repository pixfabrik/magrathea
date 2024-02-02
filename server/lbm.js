import { exec } from "child_process";

export function convertLbm(srcPath) {
  return new Promise((resolve, reject) => {
    const dstPath = srcPath + ".json";
    const command =
      "node node_modules/lbmtool/index.js " + srcPath + " --json " + dstPath;

    exec(command, function (err, stdout, stderr) {
      if (err) {
        console.log("err converting to json", srcPath, err, stderr);
        reject(err);
      } else {
        console.log("converted", srcPath, stdout);
        resolve(dstPath);
      }
    });
  });
}
