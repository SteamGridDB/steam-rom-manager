import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as os from "os";
import {BlizzardParser} from "blizzard-product-parser";

import * as fs from "fs-extra";
import * as path from "path";
import * as paths from "../../paths"
import * as json from "../helpers/json";
import { spawn } from "child_process";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { SimpleUWPApp, SimpleManifest } from '../../models';
import { glob } from 'glob';

// shamelessly borrowed from steamgriddb-manager
const BNET_GAMES: {[k: string]: 
  {
    name: string, 
    launchId: string, 
    exes: string[]
  }
} = {
  d3: {
    name: 'Diablo III',
    launchId: 'D3',
    exes: ['Diablo III', 'Diablo III64']
  },
  dst2: {
    name: 'Destiny 2',
    launchId: 'DST2',
    exes: ['destiny2']
  },
  hero: {
    name: 'Heroes of the Storm',
    launchId: 'Hero',
    exes: ['HeroesSwitcher', 'HeroesSwitcher_x64']
  },
  odin: {
    name: 'Call of Duty: Modern Warfare',
    launchId: 'ODIN',
    exes: ['codmw2019', 'ModernWarfare']
    },
  pro: {
    name: 'Overwatch',
    launchId: 'Pro',
    exes: ['Overwatch']
  },
  s1: {
    name: 'Starcraft Remastered',
    launchId: 'S1',
    exes: ['StarCraft']
  },
  s2: {
    name: 'Starcraft 2',
    launchId: 'S2',
    exes: ['SC2Switcher_x64', 'SC2Switcher']
  },
  viper: {
    name: 'Call of Duty: Black Ops 4',
    launchId: 'VIPR',
    exes: ['BlackOps4', 'BlackOps4_boot']
  },
  w3: {
    name: 'Warcraft 3: Reforged',
    launchId: 'W3',
    exes: ['Warcraft III']
  },
  hsb: {
    name: 'Hearthstone',
    launchId: 'WTCG',
    exes: ['Hearthstone']
  },
  wlby: {
    name: 'Crash Bandicoot 4',
    launchId: 'WLBY',
    exes: ['CrashBandicoot4']
  },
  wow: {
    name: 'World of Warcraft',
    launchId: 'WoW',
    exes: ['Wow']
  },
  zeus: {
    name: 'Call of Duty: Black Ops Cold War',
    launchId: 'ZEUS',
    exes: ['BlackOpsColdWar']
  },
};

export class BattleNetParser implements GenericParser {

  private get lang() {
    return '';
  }

  getParserInfo(): ParserInfo {
    return {
      title: 'Battle.net',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'battleDir': {
          label: 'Battle Dir',
          placeholder: '/path/to/battle',
          inputType: 'dir',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }): Promise<ParsedData> {
    return new Promise<ParsedData>(async (resolve, reject) => {
      if (os.type() !== 'Windows_NT') {
        reject(this.lang.errors.UWPNotCompatible)
      }
      try {
        const dbPath = 'C:\\ProgramData\\Battle.net\\Agent\\product.db';
        const bNetExe = 'C:\\Program Files (x86)\\Battle.net\\Battle.net.exe';
        const bNetDir = path.dirname(bNetExe)
        const scriptPath = createScriptIfMissing();

        let finalData: ParsedData = { 
          success: [], 
          failed: [], 
          executableLocation:  `C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
        };
        const decoder = new BlizzardParser(dbPath);
        decoder.decode()
        const rawData = decoder.getRaw();
        const installed = rawData.productInstall.filter((product: any) => !(product.uid==='battle.net'||product.uid==='agent'))
        for(let product of installed) {
          const gameId = product.uid;
          const productCode: string = product.productCode.toLowerCase();
          if(BNET_GAMES[productCode]) {
            const { launchId, name, exes } = BNET_GAMES[productCode];
            finalData.success.push({
              extractedTitle: name,
              startInDirectory: bNetDir,
              launchOptions: `-File "${scriptPath}" -bnet "${bNetExe}" -launchid "${launchId}"`
            })
          }
        }
        resolve(finalData)
      }
      catch (err) {
        reject(this.lang.errors.fatalError__i.interpolate({ error: err }));
      };
    })
  }
}

const createScriptIfMissing = () => {
  const scriptPath = path.join(paths.userDataDir,'bnet.ps1');
  const psScriptContent =`param (
    [Parameter(Mandatory=$True)][string]$bnet,    # Path to the Battle.net executable
    [Parameter(Mandatory=$True)][string]$launchid # Battle.net launch id to launch
)
Write-Host 'Stopping Battle.net'
Get-Process "battle.net" -ErrorAction SilentlyContinue | Stop-Process

Write-Host 'Starting Battle.net'
Start-Process $bnet

# Wait to be sure log file gets created (just to be safe, usually gets created instantly)
Start-Sleep -Seconds 3

# Get latest log file
$log = Get-ChildItem -Path "$env:LOCALAPPDATA\\Battle.net\\Logs" -Filter "battle.net-*.log" | Sort-Object LastAccessTime -Descending | Select-Object -First 1
Write-Host "Log Directory: $log"
$bnetStarted = $False

Write-Host 'Waiting for Battle.net to start completely'

# Get current system date
$currentDate = Get-Date
Do {
    # Check log file until we find this string
    $launchedCompletely = Select-String -path $log -pattern 'GameController initialization complete'
    Write-Host "Launched Completely: $(!$launchedCompletely)"
    If (!($launchedCompletely)) {
        # Timeout after 1 minute
        If ($currentDate.AddMinutes(1) -lt (Get-Date))
        {
            Write-Host 'Could not find successful launch'
            exit
        }
        Start-Sleep -Seconds 1
    } Else {
        Write-Host 'Bnet started!'
        $bnetStarted = $True
    }
} Until ($bnetStarted)

# Launch 
Write-Host "Starting game ($launchid)"
Start-Process $bnet "--exec=\`"launch $launchid\`""`;
  fs.writeFileSync(scriptPath, psScriptContent);
  return scriptPath
}