import { spawn, execSync } from "child_process";
import * as os from "os";

const checkDelay = 500;
const timeout = 5000;

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
    shell: string
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
            proc.stderr.on('data', (data) => {
                reject(data.toString('utf8'))
            })
            proc.on('close', () => { 
                let elapsed = 0;
                const interval: NodeJS.Timer = setInterval(() => {
                    const check = execSync(data.commands.check, {shell: data.shell}).toString().trim()
                    if(check == data.checkOutput){
                        messages.push(data.messages.success.interpolate({elapsed}))
                        clearTimeout(interval)
                        resolve({acted: true, messages: messages});
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
        shell: 'powershell'
    }
    if (os.type() == 'Windows_NT') {
        data.commands = {
            action: `wmic process where "name='steam.exe'" delete`,
            check: `(Get-Process steam -ErrorAction SilentlyContinue) -eq $null`
        }
    } else if (os.type() == 'Linux') {
        data.commands = {
            action: `killall steam`,
            check: `echo "True"`
        }
    }
    return await actAndCheck(data);
}

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
        shell: 'powershell'
    };
    if (os.type() == 'Windows_NT') {
        data.commands = {
            action: "Start-Process -WindowStyle Minimized ${env:PROGRAMFILES(x86)}\\Steam\\steam.exe -ArgumentList \"-silent\"",
            check: `(Get-Process steam -ErrorAction SilentlyContinue) -ne $null`
        }
    } else if (os.type() == 'Linux') {
        data.commands = {
            action: `start steam`,
            check: `echo "True"`
        }
    }
    return await actAndCheck(data)
}