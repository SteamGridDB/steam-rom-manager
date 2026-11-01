// Stand-in for src/lib/helpers/steam/stop-start-steam.ts. The real module
// kills and relaunches the Steam client via shell commands; no test may ever
// do that to the machine it runs on. Calls are recorded instead.
export const steamControlCalls: string[] = [];

export async function stopSteam() {
  steamControlCalls.push("stop");
  return { acted: false, messages: [] as string[] };
}

export async function startSteam() {
  steamControlCalls.push("start");
  return { acted: false, messages: [] as string[] };
}

export async function performSteamlessTask(
  _appSettings: unknown,
  _loggerService: unknown,
  task: () => Promise<void>,
) {
  steamControlCalls.push("steamless-task");
  await task();
}
