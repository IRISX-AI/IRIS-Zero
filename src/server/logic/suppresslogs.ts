import { fork } from "child_process";
import path from "path";
import fs from "fs";

export const transcribeInWorker = (
  pcmf32: Float32Array,
  modelPath: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Determine path to worker file (.ts in development, .js in production/build)
    let workerPath = path.resolve(
      process.cwd(),
      "src/server/logic/whisper-worker.ts",
    );
    if (!fs.existsSync(workerPath)) {
      workerPath = path.resolve(
        process.cwd(),
        "src/server/logic/whisper-worker.js",
      );
    }

    const child = fork(workerPath, [], {
      execArgv: process.execArgv,
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });

    child.send({ pcmf32: Array.from(pcmf32), modelPath });

    let resultText = "";

    child.on("message", (msg: any) => {
      if (msg.success) {
        resultText = msg.text;
      } else {
        reject(new Error(msg.error));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(resultText);
      } else {
        reject(new Error(`Whisper worker exited with code ${code}`));
      }
    });
  });
};
