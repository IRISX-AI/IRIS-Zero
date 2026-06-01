import { execSync } from "child_process";
import fs from "fs";

// Redirect stdout/stderr at the OS level before calling whisper
export const suppressWhisperLogs = async <T>(
  fn: () => Promise<T>,
): Promise<T> => {
  const devNull = process.platform === "win32" ? "NUL" : "/dev/null";

  // Save original file descriptors
  const savedStdout = process.stdout.fd;
  const savedStderr = process.stderr.fd;

  const nullFd = fs.openSync(devNull, "w");

  // Redirect fd 1 and 2 to /dev/null (or NUL on Windows)
  (process.stdout as any)._handle?.setBlocking?.(true);
  const oldOut = fs.dupSync(1);
  const oldErr = fs.dupSync(2);
  fs.dup2Sync(nullFd, 1);
  fs.dup2Sync(nullFd, 2);

  try {
    return await fn();
  } finally {
    // Restore
    fs.dup2Sync(oldOut, 1);
    fs.dup2Sync(oldErr, 2);
    fs.closeSync(oldOut);
    fs.closeSync(oldErr);
    fs.closeSync(nullFd);
  }
};
