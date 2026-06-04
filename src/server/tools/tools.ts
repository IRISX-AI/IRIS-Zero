import {
  fetchInstalledApps,
  fetchStorageDrives,
  fetchSystemStats,
} from "../bin/system-info.js";
import { executeFSOperation } from "../bin/file-system.js";
import { manageApp } from "../bin/app-control.js";

export const systemToolDeclarations: ToolDeclaration[] = [
  {
    name: "get_system_stats",
    description:
      "Retrieves real-time system telemetry including CPU usage, RAM usage, CPU temperature, and Network latency.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_installed_apps",
    description:
      "Retrieves a list of all installed applications and software on the host machine.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_storage_drives",
    description:
      "Retrieves information about the attached hard drives, including Total Space and Free Space in GB.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "file_system_operation",
    description:
      "Performs a local file system operation. Use this to read, write, copy, move, delete, create directories, or list folder contents.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description:
            'The specific operation to perform. MUST be one of: "read", "write", "append", "copy", "move", "delete", "mkdir", "list"',
        },
        targetPath: {
          type: Type.STRING,
          description:
            'The primary file or directory path to act upon (e.g., "~/Documents/project" or "C:/data.txt").',
        },
        destPath: {
          type: Type.STRING,
          description:
            'The destination path. ONLY required for "copy" and "move" actions.',
        },
        content: {
          type: Type.STRING,
          description:
            'The text content to inject. ONLY required for "write" and "append" actions.',
        },
      },
      required: ["action", "targetPath"],
    },
  },
  {
    name: "manage_application",
    description:
      "Forcefully opens or completely terminates software applications running on the host machine across Windows, Mac, or Linux.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description:
            'The action to perform. MUST be either "open" or "close".',
        },
        appName: {
          type: Type.STRING,
          description:
            'The common or colloquial name of the app. Prefer clean names like "code", "chrome", "file manager", "spotify", "discord", "terminal", or "calculator". Do not append file extensions like .exe.',
        },
      },
      required: ["action", "appName"],
    },
  },
];

export async function executeSystemTool(fc: any) {
  const functionName = fc.name;
  const args = fc.args || {};
  let result: any = {};

  try {
    switch (functionName) {
      case "get_system_stats":
        result = await fetchSystemStats();
        break;
      case "get_installed_apps":
        result = await fetchInstalledApps();
        break;
      case "get_storage_drives":
        result = await fetchStorageDrives();
        break;
      case "file_system_operation":
        result = await executeFSOperation(
          args.action,
          args.targetPath,
          args.destPath,
          args.content,
        );
        break;
      case "manage_application":
        result = await manageApp(args.action, args.appName);
        break;
      default:
        throw new Error(
          `Tool ${functionName} is not implemented inside the router.`,
        );
    }

    return {
      id: fc.id,
      name: functionName,
      response: { result: result },
    };
  } catch (error: any) {
    console.error(`[Tool Execution Error] ${functionName}:`, error);
    return {
      id: fc.id,
      name: functionName,
      response: {
        error: error.message || "Unknown error occurred during tool execution.",
      },
    };
  }
}
