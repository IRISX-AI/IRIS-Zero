import os from "os";
import { exec } from "child_process";

const runCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
      if (error) resolve("");
      resolve(stdout ? stdout.trim() : "");
    });
  });
};

let cpuLastSnapshot = os.cpus();

function getSystemCpuUsage(): string {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i];
    const prevCpu = cpuLastSnapshot[i];
    let currentTotal = 0;
    for (const type in cpu.times)
      currentTotal += cpu.times[type as keyof typeof cpu.times];
    let prevTotal = 0;
    for (const type in prevCpu.times)
      prevTotal += prevCpu.times[type as keyof typeof prevCpu.times];
    idle += cpu.times.idle - prevCpu.times.idle;
    total += currentTotal - prevTotal;
  }
  cpuLastSnapshot = cpus;
  return total === 0 ? "0.0" : (((total - idle) / total) * 100).toFixed(1);
}

export async function fetchInstalledApps() {
  try {
    const platform = os.platform();
    if (platform === "win32") {
      const cmd = `powershell "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Depth 1"`;
      const jsonOutput = await runCommand(cmd);
      if (!jsonOutput) return [];
      const rawData = JSON.parse(jsonOutput);
      const appsArray = Array.isArray(rawData) ? rawData : [rawData];
      return appsArray
        .filter((a: any) => a && a.Name && a.AppID)
        .map((a: any) => ({ name: a.Name.trim(), id: a.AppID.trim() }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else if (platform === "darwin") {
      const cmd = `mdfind "kMDItemContentType == 'com.apple.application-bundle'"`;
      const output = await runCommand(cmd);
      return output
        .split("\n")
        .filter((p) => p.includes("/Applications/"))
        .map((p) => ({
          name: p.split("/").pop()?.replace(".app", "") || "Unknown",
          id: p,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else if (platform === "linux") {
      const cmd = `ls /usr/share/applications | grep .desktop`;
      const output = await runCommand(cmd);
      return output.split("\n").map((p) => ({
        name: p.replace(".desktop", "").replace(/-/g, " "),
        id: p,
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

export async function fetchSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const cpuString = getSystemCpuUsage();
  const cpuNum = parseFloat(cpuString);

  const estimatedTemp = 40 + cpuNum * 0.4 + Math.random() * 2;
  const tx = Math.floor(Math.random() * 40) + (cpuNum > 20 ? 40 : 0);
  const rx = Math.floor(Math.random() * 60) + (cpuNum > 10 ? 20 : 0);

  let osName = "UNKNOWN";
  if (os.platform() === "win32") osName = "WIN 11";
  if (os.platform() === "darwin") osName = "MACOS";
  if (os.platform() === "linux") osName = "LINUX";

  return {
    cpu: cpuString,
    memory: {
      total: (totalMem / 1024 ** 3).toFixed(1),
      free: (freeMem / 1024 ** 3).toFixed(1),
      usedPercentage: (((totalMem - freeMem) / totalMem) * 100).toFixed(1),
    },
    temperature: estimatedTemp,
    os: { type: osName, uptime: (os.uptime() / 3600).toFixed(1) + "h" },
    network: { tx, rx, latency: Math.floor(Math.random() * 15) + 20 },
  };
}

export async function fetchStorageDrives() {
  try {
    if (os.platform() === "win32") {
      const cmd = `powershell "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N='FreeGB';E={[math]::round($_.Free/1GB, 2)}}, @{N='TotalGB';E={[math]::round(($_.Used + $_.Free)/1GB, 2)}} | ConvertTo-Json"`;
      const output = await runCommand(cmd);
      return output ? JSON.parse(output) : [];
    } else {
      const cmd = `df -h | awk '$1 ~ /^\\/dev\\// {print $1, $4, $2}'`;
      const output = await runCommand(cmd);
      return output.split("\n").map((line) => {
        const parts = line.split(" ");
        return { Name: parts[0], FreeGB: parts[1], TotalGB: parts[2] };
      });
    }
  } catch (e) {
    return [];
  }
}
