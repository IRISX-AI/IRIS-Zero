import {
  fetchInstalledApps,
  fetchStorageDrives,
  fetchSystemStats,
} from "../bin/system-info.js";
import { executeFSOperation } from "../bin/file-system.js";
import { manageApp } from "../bin/app-control.js";
import * as z from "zod";
import { tool } from "langchain";

export const getSystemStats = tool(
  async () => {
    return await fetchSystemStats();
  },
  {
    name: "get_system_stats",
    description:
      "Retrieves real-time system telemetry including CPU usage, RAM usage, CPU temperature, and Network latency.",
    schema: z.object({}),
  },
);

export const getInstalledApps = tool(
  async () => {
    return await fetchInstalledApps();
  },
  {
    name: "get_installed_apps",
    description:
      "Retrieves a list of all installed applications and software on the host machine.",
    schema: z.object({}),
  },
);

export const getStorageDrives = tool(
  async () => {
    return await fetchStorageDrives();
  },
  {
    name: "get_storage_drives",
    description:
      "Retrieves information about the attached hard drives, including Total Space and Free Space in GB.",
    schema: z.object({}),
  },
);

export const fileSystemOperation = tool(
  async ({ action, targetPath, destPath, content }) => {
    return await executeFSOperation(action, targetPath, destPath, content);
  },
  {
    name: "file_system_operation",
    description:
      "Performs a local file system operation. Use this to read, write, copy, move, delete, create directories, or list folder contents.",
    schema: z.object({
      action: z
        .enum([
          "read",
          "write",
          "append",
          "copy",
          "move",
          "delete",
          "mkdir",
          "list",
        ])
        .describe("The specific operation to perform."),
      targetPath: z
        .string()
        .describe(
          'The primary file or directory path to act upon (e.g., "~/Documents/project" or "C:/data.txt").',
        ),
      destPath: z
        .string()
        .optional()
        .describe(
          'The destination path. ONLY required for "copy" and "move" actions.',
        ),
      content: z
        .string()
        .optional()
        .describe(
          'The text content to inject. ONLY required for "write" and "append" actions.',
        ),
    }),
  },
);

export const manageApplication = tool(
  async ({ action, appName }) => {
    return await manageApp(action, appName);
  },
  {
    name: "manage_application",
    description:
      "Forcefully opens or completely terminates software applications running on the host machine across Windows, Mac, or Linux.",
    schema: z.object({
      action: z.enum(["open", "close"]).describe("The action to perform."),
      appName: z
        .string()
        .describe(
          'The common or colloquial name of the app. Prefer clean names like "code", "chrome", "file manager", "spotify", "discord", "terminal", or "calculator". Do not append file extensions like .exe.',
        ),
    }),
  },
);

export const systemToolDeclarations = [
  getSystemStats,
  getInstalledApps,
  getStorageDrives,
  fileSystemOperation,
  manageApplication,
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
