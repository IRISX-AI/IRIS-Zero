import fs from "fs-extra";
import path from "path";
import os from "os";

const resolvePath = (target: string) => {
  return path.resolve(target.replace(/^~/, os.homedir()));
};

export async function executeFSOperation(
  action: string,
  targetPath: string,
  destPath?: string,
  content?: string,
) {
  const resolvedTarget = resolvePath(targetPath);
  const resolvedDest = destPath ? resolvePath(destPath) : undefined;

  try {
    switch (action) {
      case "read":
        return await fs.readFile(resolvedTarget, "utf-8");

      case "write":
        await fs.outputFile(resolvedTarget, content || "");
        return `SUCCESS: Wrote to ${targetPath}`;

      case "append":
        await fs.appendFile(resolvedTarget, content || "");
        return `SUCCESS: Appended to ${targetPath}`;

      case "copy":
        if (!resolvedDest)
          throw new Error("Destination path required for copy.");
        await fs.copy(resolvedTarget, resolvedDest);
        return `SUCCESS: Copied ${targetPath} to ${destPath}`;

      case "move":
        if (!resolvedDest)
          throw new Error("Destination path required for move.");
        await fs.move(resolvedTarget, resolvedDest, { overwrite: true });
        return `SUCCESS: Moved ${targetPath} to ${destPath}`;

      case "delete":
        await fs.remove(resolvedTarget);
        return `SUCCESS: Deleted ${targetPath}`;

      case "mkdir":
        await fs.ensureDir(resolvedTarget);
        return `SUCCESS: Created directory ${targetPath}`;

      case "list":
        const items = await fs.readdir(resolvedTarget);
        return items.length > 0 ? items.join("\n") : "Directory is empty.";

      default:
        throw new Error(`UNSUPPORTED ACTION: ${action}`);
    }
  } catch (err: any) {
    console.error(
      `[FS Engine Error] Action: ${action} | Target: ${targetPath}`,
      err,
    );
    return `ERROR: ${err.message}`;
  }
}
