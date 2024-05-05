import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as os from "os";
import { BlizzardParser } from "blizzard-product-parser";
import * as fs from "fs-extra";
import * as path from "path";
import * as paths from "../../paths"

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
    name: 'Overwatch 2',
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
  fenris: {
    name: 'Diablo IV',
    launchId: 'Fen',
    exes: ['Diablo IV']
  },
  anbs: {
    name: 'Diablo Immortal',
    launchId: 'ANBS',
    exes: ['DiabloImmortal']
  },
  osi: {
    name: 'Diablo II: Resurrected',
    launchId: 'OSI',
    exes: ['D2R']
  },
  rtro: {
    name: 'Blizzard Arcade Collection',
    launchId: 'RTRO',
    exes: ['Blizzard Arcade Collection Launcher']
  },
  lazr: {
    name: 'Call of Duty: Modern Warfare 2 Campaign Remastered',
    launchId: 'LAZR',
    exes: ['MW2CR']
  },
  fore: {
    name: 'Call of Duty: Vanguard',
    launchId: 'FORE',
    exes: ['Vanguard']
  },
};

export class BattleNetParser implements GenericParser {

  private get lang() {
    return APP.lang.battleNetParser;
  }

  getParserInfo(): ParserInfo {
    return {
      title: 'Battle.net',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'battleExeOverride': {
          label: this.lang.battleExeOverrideTitle,
          placeholder: this.lang.battleExeOverridePlaceholder,
          inputType: 'path',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }): Promise<ParsedData> {
    return new Promise<ParsedData>(async (resolve, reject) => {
      if (os.type() !== 'Windows_NT') {
        return reject(this.lang.errors.battleNotCompatible)
      }
      try {
        const dbPath = 'C:\\ProgramData\\Battle.net\\Agent\\product.db';
        const bNetExe = inputs.battleExeOverride || 'C:\\Program Files (x86)\\Battle.net\\Battle.net.exe';
        const bNetDir = path.dirname(bNetExe)
        const scriptPath = path.join(paths.userDataDir,'scripts','bnet.ps1');
        if(!fs.existsSync(scriptPath)) {
          reject('bnet.ps1 script is missing')
        }
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
          const productCode: string = product.productCode.toLowerCase();
          if(BNET_GAMES[productCode]) {
            const { launchId, name } = BNET_GAMES[productCode];
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
