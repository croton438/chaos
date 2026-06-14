import { spawn } from "node:child_process";

const workspaces = ["shared", "server", "client"];
const children = workspaces.map((workspace) => {
  if (process.platform === "win32") {
    return spawn(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/s", "/c", `npm run dev --workspace=${workspace}`],
      { stdio: "inherit", windowsHide: true },
    );
  }

  return spawn("npm", ["run", "dev", `--workspace=${workspace}`], { stdio: "inherit" });
});

const stop = () => {
  for (const child of children) child.kill();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

const exitCodes = await Promise.all(
  children.map(
    (child) => new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 0))),
  ),
);

process.exit(exitCodes.find((code) => code !== 0) ?? 0);
