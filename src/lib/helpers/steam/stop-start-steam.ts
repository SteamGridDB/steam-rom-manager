import { spawn, execSync } from "child_process";
import * as os from "os";
import { AppSettings } from "../../../models";
import { LoggerService } from "../../../renderer/services";

const checkDelay = 500;
const timeout = 60000;

interface ActAndCheck {
    commands: {
        action: string,
        check: string,
    },
    messages: {
        prefix: string,
        success: string,
        failure: string,
        precheckPassed: string
    },
    checkOutput: string,
    shell: string,
    safetyDelay: number
}

async function actAndCheck(data: ActAndCheck) {
    return await new Promise<{acted: boolean, messages: string[]}>((resolve, reject)=> {
        let messages: string[] = [];
        const precheck = execSync(data.commands.check, {shell: data.shell}).toString().trim();
        if(precheck == data.checkOutput) {
            resolve({acted: false, messages: [data.messages.precheckPassed]})
        } else {
            const proc = spawn(data.commands.action, {shell: data.shell});
            proc.stdout.on('data', (procData) => {
                messages.push(`${data.messages.prefix}: ${procData.toString('utf8')}`)
            })
            proc.stderr.on('data', (procErr) => {
                messages.push(`${data.messages.prefix} (Error): ${procErr.toString('utf8')}`)
            })
            proc.on('close', () => { 
                let elapsed = 0;
                let interval: NodeJS.Timer = setInterval(() => {
                    const check = execSync(data.commands.check, {shell: data.shell}).toString().trim()
                    if(check == data.checkOutput) {
                        clearTimeout(interval);
                        let delay = setTimeout(()=> {
                            clearTimeout(delay);
                            messages.push(data.messages.success.interpolate({elapsed: elapsed + data.safetyDelay}))
                            resolve({acted: true, messages: messages});

                        }, data.safetyDelay)
                    }
                    if(elapsed > timeout) {
                        reject(data.messages.failure.interpolate({timeout}))
                        clearTimeout(interval)
                    }
                    elapsed += checkDelay;
                }, checkDelay)
            })
        }
    })
}

// try to kill steam
export async function stopSteam() {
    let data: ActAndCheck = {
        commands: null,
        messages: {
            prefix: "Killing Steam",
            success: "Killed Steam after ${elapsed}ms.",
            failure: "Failed to kill Steam within ${timeout}ms.",
            precheckPassed: "Steam is not running, no need to kill it."
        },
        checkOutput: 'True',
        safetyDelay: 2000,
        shell: null
    }
    if (os.type() == 'Windows_NT') {
        data.commands = {
            action: "Start-Process \"${env:PROGRAMFILES(X86)}\\Steam\\steam.exe\" \"-shutdown\"",
            check: `(Get-Process steam -ErrorAction SilentlyContinue) -eq $null`
        }
        data.shell = 'powershell'
    } else if (os.type() == 'Linux') {
        data.commands = {
            action: `kill -15 $(pidof steam)`,
            check: `levelfile=$(ls -t "$HOME/.steam/steam/config/htmlcache/Local Storage/leveldb"/*.ldb | head -1);
                    pid=$(fuser "$levelfile");
                    if [ -z $pid ]; then echo "True"; else echo "False"; fi;`
        }
        data.shell = '/bin/sh';
    }
    return await actAndCheck(data);
}

//try to restart steam
export async function startSteam() {
    let data: ActAndCheck = {
        commands: null,
        messages: {
            prefix: "Starting Steam",
            success: "Started Steam after ${elapsed}ms.",
            failure: "Failed to start Steam within ${timeout}ms.",
            precheckPassed: "Steam is already running, no need to start it."
        },
        checkOutput: 'True',
        safetyDelay: 0,
        shell: null,

    };
    if (os.type() == 'Windows_NT') {
        data.commands = {
            action: "Start-Process -WindowStyle Minimized ${env:PROGRAMFILES(x86)}\\Steam\\steam.exe -ArgumentList \"-silent\"",
            check: `(Get-Process steam -ErrorAction SilentlyContinue) -ne $null`
        }
        data.shell = 'powershell';
    } else if (os.type() == 'Linux') {
        data.commands = {
            action: `2>/dev/null 1>&2 steam -silent &`,
            check: `pid="$(pidof steam)"; if [ ! -z $pid ]; then echo "True"; else echo "False"; fi;`
        }
        data.shell = '/bin/sh'
    }
    return await actAndCheck(data)
}

export async function performSteamlessTask(appSettings: AppSettings, loggerService: LoggerService, task: () => Promise<void>) {
    if(os.type() == 'Darwin') {
        loggerService.info('Not attempting to kill Steam on Mac OS.');
        await task(); return;
    }
    let stop: { acted: boolean, messages: string[] };
    if(appSettings.autoKillSteam) {
        loggerService.info('Attempting to kill Steam.', {invokeAlert: true, alertTimeout: 3000})
        stop = await stopSteam();
        for(let message of stop.messages) { loggerService.info(message) }
    }
    await task();
    if(appSettings.autoRestartSteam && stop.acted) {
        loggerService.info('Attempting to restart Steam.', {invokeAlert: true, alertTimeout: 3000})
        const start = await startSteam();
        for(let message of start.messages) { loggerService.info(message) }
    }
}