import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as json from "../helpers/json";
import { spawnSync } from "child_process";
import { XMLParser, XMLValidator} from "fast-xml-parser";
import { globPromise } from '../helpers/glob/promise';

export class UWPParser implements GenericParser {

  private get lang() {
    return APP.lang.UWPParser;
  }

  getParserInfo(): ParserInfo {
    return {
      title: 'UWP',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'UWPDir': {
          label: this.lang.UWPDirTitle,
          inputType: 'dir',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        },
        'UWPLauncherMode': {
          label: this.lang.UWPLauncherModeTitle,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve, reject) => {

      let appIds: string[] = [];
      let appArgs: string[] = [];
      let appTitles: string[] = [];
      let appPaths: string[] = [];
      if (os.type() !== 'Windows_NT') {
        reject(this.lang.errors.UWPNotCompatible)
      }

      const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      let UWPDir: string = inputs.UWPDir || "C:\\XboxGames";

      globPromise(path.join(UWPDir.replace(/\\/g,'/'),'**','Content','appxmanifest.xml'))
      .then((files: string[])=>{
        files.forEach((file)=>{
          if(fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            console.log("file",file)
            var xmldata = fs.readFileSync(file,'utf-8');
            if(XMLValidator.validate(xmldata)) {
              const parsedData: any = xmlParser.parse(xmldata);

              console.log("parsedData", parsedData)
              var gameManifest: SimpleManifest = {
                idName: json.caseInsensitiveTraverse(parsedData,[["Package"],["Identity"],["@_Name"]]),
                idPublisher: json.caseInsensitiveTraverse(parsedData,[["Package"],["Identity"],["@_Publisher"]]),
                appExecutable: json.caseInsensitiveTraverse(parsedData,[["Package"],["Applications"],["Application"],["@_Executable"]])
              } as SimpleManifest;
              console.log("gameManifest",gameManifest)
              if(gameManifest.idName && gameManifest.idPublisher && gameManifest.appExecutable) {
                var gameDetail: SimpleUWPApp = getUWPAppDetail(gameManifest, xmlParser);
                appTitles.push(gameDetail.name);
                appIds.push(gameDetail.appId);
                appPaths.push(gameDetail.path);
                appArgs.push(gameDetail.arguments);
              }
            }
          }
        })
      })
      .then(()=>{
        let parsedData: ParsedData = {
          executableLocation: "C:\\WINDOWS\\explorer.exe",
          success: [],
          failed:[]
        };
        for(let i=0; i < appTitles.length; i++){
          parsedData.success.push({
            extractedTitle: appTitles[i],
            launchOptions: appArgs[i],
            filePath: appPaths[i]
          });
        }
        resolve(parsedData);
      }).catch((err)=>{
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });
    })
  }
}

// extracted data
interface SimpleUWPApp {
  name: string,
  workdir: string,
  path: string,
  arguments: string,
  appId: string
}

// xml manifest data
interface SimpleManifest {
  idName: string,
  idPublisher: string,
  appExecutable: string
}

// json package manager data
interface UWPObj {
  Dependencies: Array<string>,
  Id: {
    Architecture: number,
    FamilyName: string,
    FullName: string,
    Name: string,
    Publisher: string,
    PublisherId: string,
    ResourceId: string,
    Version: string,
    Author: string,
    ProductId: string
  },
  InstalledLocation: {
    Attributes: number,
    DateCreated: string,
    Name: string,
    Path: string,
    DisplayName: string,
    DisplayType: string,
    FolderRelativeId: string,
    Properties: string,
    Provider: string
  },
  IsFramework: boolean,
  Description: string,
  DisplayName: string,
  IsBundle: boolean,
  IsDevelopmentMode: boolean,
  IsResourcePackage: boolean,
  Logo: string,
  PublisherDisplayName: string,
  InstalledDate: string,
  Status: {
    DataOffline: boolean,
    DependencyIssue: boolean,
    DeploymentInProgress: boolean,
    Disabled: boolean,
    LicenseIssue: boolean,
    Modified: boolean,
    NeedsRemediation: boolean,
    NotAvailable: boolean,
    PackageOffline: boolean,
    Servicing: boolean,
    Tampered: boolean,
    IsPartiallyStaged: boolean
  },
  IsOptional: boolean,
  SignatureKind: number,
  EffectiveLocation: {
    Attributes: number,
    DateCreated: string,
    Name: string,
    Path: string,
    DisplayName: string,
    DisplayType: string,
    FolderRelativeId: string,
    Properties: string,
    Provider: string
  },
  MutableLocation: null,
  EffectiveExternalLocation: {
    Attributes: number,
    DateCreated: string,
    Name: string,
    Path: string,
    DisplayName: string,
    DisplayType: string,
    FolderRelativeId: string,
    Properties: string,
    Provider: string
  },
  EffectiveExternalPath: string,
  EffectivePath: string,
  InstalledPath: string,
  IsStub: boolean,
  MachineExternalLocation: {
    Attributes: number,
    DateCreated: string,
    Name: string,
    Path: string,
    DisplayName: string,
    DisplayType: string,
    FolderRelativeId: string,
    Properties: string,
    Provider: string
  },
  MachineExternalPath: string,
  MutablePath: string,
  UserExternalLocation: {
    Attributes: number,
    DateCreated: string,
    Name: string,
    Path: string,
    DisplayName: string,
    DisplayType: string,
    FolderRelativeId: string,
    Properties: string,
    Provider: string
  },
  UserExternalPath: string,
  SourceUriSchemeName: string,
  InstallDate: string
}

// inspired by https://github.com/JosefNemec/Playnite/blob/master/source/Playnite/Common/Resources.cs
function getIndirectResourceString(fullName: string, packageName: string, resource: string) {
  const lastSegment = new URL(resource).pathname.split("/").reverse()[0];

  var resourceString;

  if (resource.toString().startsWith("ms-resource://")) {
    //$"@{{{fullName}? {resource}}}";
    resourceString = `@{${fullName}? ${resource}}`;
  } else if (resource.toString().includes("/")) {
    //$"@{{{fullName}? ms-resource://{packageName}/{resource.Replace("ms-resource:", "").Trim('/')}}}";
    const cleanResource = resource
      .toString()
      .replace("ms-resource:", "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    resourceString = `@{${fullName}? ms-resource://${packageName}/${cleanResource}}`;
  } else {
    //$"@{{{fullName}? ms-resource://{packageName}/resources/{resUri.Segments.Last()}}}";
    resourceString = `@{${fullName}? ms-resource://${packageName}/resources/${lastSegment}}`;
  }

  const psScriptPath = path.join(process.env.TEMP, 'SHLoadIndirectString.ps1');

  try {
    const psScriptContent = `Param($pszSource)
$sb = [System.Text.StringBuilder]::new(1024)
$MemberDefinition = @"
[DllImport("shlwapi.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        public static extern int SHLoadIndirectString(string pszSource, [MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszOutBuf, uint cchOutBuf, IntPtr ppvReserved);
"@
Add-Type -MemberDefinition $MemberDefinition -Name "Shlwapi" -Namespace "Win32"
$returnValue = [Win32.Shlwapi]::SHLoadIndirectString($pszSource, $sb, $sb.Capacity, [IntPtr]::Zero)
$htable = @{
    "intValue" = $returnValue
    "stringValue" = $sb.ToString()
    }
$htable | ConvertTo-Json
`
    fs.writeFileSync(psScriptPath, psScriptContent);
  } catch (err) {
    console.error(err);
  }

  var jsonResult;

  try {
    var result = spawnSync(
      psScriptPath, ['-pszSource', `"${resourceString}"`],
      {
        shell: 'powershell',
        encoding: "utf-8",
      }
    ).stdout;
    jsonResult = JSON.parse(result);
    if (jsonResult.intValue === 0) {
      return jsonResult.stringValue;
    }
  }
  catch (err) {
    console.error("Error parsing json: " + err);
  }

  resourceString = `@{${fullName}? ms-resource://${packageName}/${lastSegment}}`;
  try {
    var result = spawnSync(
      psScriptPath, ['-pszSource', `"${resourceString}"`],
      {
        shell: 'powershell',
        encoding: "utf-8",
      }
    ).stdout;
    jsonResult = JSON.parse(result);
    if (jsonResult.intValue === 0) {
      return jsonResult.stringValue;
    }
  }
  catch (err) {
    console.error("Error parsing json: " + err);
  }

  return '';
}

function getUWPAppDetail(manifest: SimpleManifest, xmlParser: XMLParser) {
  var uwpApp: SimpleUWPApp = {} as SimpleUWPApp;

  console.log(`Searching for UWP app: ${manifest.idName}, ${manifest.idPublisher}`);
  const searchResults = spawnSync(
    `$PkgMgr = [Windows.Management.Deployment.PackageManager,Windows.Web,ContentType=WindowsRuntime]::new(); $PkgMgr.FindPackagesForUser([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value, "${manifest.idName}", "${manifest.idPublisher}") | ConvertTo-Json`,
    {
      shell: 'powershell',
      encoding: "utf-8",
    }
  ).stdout;
  console.log("searchResults",searchResults)
  const jsonuwpapp = JSON.parse(searchResults);

  console.log(`found json: ${JSON.stringify(jsonuwpapp)}`);
  if (
    jsonuwpapp.IsFramework ||
    jsonuwpapp.IsResourcePackage ||
    jsonuwpapp.SignatureKind != 3 // https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.packagesignaturekind
  ) {
    return;
  }

  // parse manifest files
  try {
    var manifestPath;
    if (jsonuwpapp.IsBundle) {
      manifestPath = "AppxMetadataAppxBundleManifest.xml";
    } else {
      manifestPath = "AppxManifest.xml";
    }
    manifestPath = path.join(jsonuwpapp.InstalledLocation.Path, manifestPath);

    var xml = fs.readFileSync(manifestPath, "utf8");

    var apxApp: string;
    var appId: string;
    var name: string;
    if(XMLValidator.validate(xml)) {
      let parsedData: any = xmlParser.parse(xml);
      console.log("appdetails",parsedData)
      apxApp = json.caseInsensitiveTraverse(parsedData,[["Package"],["Applications"],["Application"]]);
      appId = json.caseInsensitiveTraverse(apxApp,[["@_Id"]]);
      name = json.caseInsensitiveTraverse(parsedData,[["Package"],["Properties"],["DisplayName"]]);

      if (name.toString().startsWith("ms-resource")) {
        console.debug(`name starts with ms-resource: ${name}"`);
        name = getIndirectResourceString(jsonuwpapp.Id.FullName, jsonuwpapp.Id.Name, name);
        if (name == null || name == "") {
          name = json.caseInsensitiveTraverse(parsedData,[["Package"],["Identity"],["@_Name"]]);
        }
      }

      console.debug(`Parsed UWP App Manifest: ${name}`);

      uwpApp.name = name;
      uwpApp.workdir = jsonuwpapp.InstalledLocation.Path;
      uwpApp.path = path.join(jsonuwpapp.InstalledLocation.Path,manifest.appExecutable).toString();
      uwpApp.arguments = `shell:AppsFolder\\${jsonuwpapp.Id.FamilyName}!${appId}`;
      uwpApp.appId = jsonuwpapp.Id.FamilyName;

    }
  } catch (err) {
    console.error("Error parsing xml files: " + err);
  }
  return uwpApp;
}







// inspired https://github.com/JosefNemec/Playnite/blob/master/source/Playnite/Common/Programs2.cs
// unused, useful for deep searching apps
// function getUWPApps() {
//   var uwpApps: Array<SimpleUWPApp> = [];
//
//   console.debug(`Reading UWP apps installed, please wait`);
//   const jsonuwpapps = JSON.parse(spawnSync(
//     '$PkgMgr = [Windows.Management.Deployment.PackageManager,Windows.Web,ContentType=WindowsRuntime]::new(); $PkgMgr.FindPackagesForUser([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value) | ConvertTo-Json',
//     {
//       shell: 'powershell',
//       encoding: "utf-8",
//     }
//   ).stdout);
//
//   jsonuwpapps.forEach((element: UWPObj) => {
//     if (
//       element.IsFramework ||
//       element.IsResourcePackage ||
//       element.SignatureKind != 3 // https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.packagesignaturekind
//     ) {
//       return;
//     }
//
//     // parse manifest files
//     try {
//       var manifestPath;
//       if (element.IsBundle) {
//         manifestPath = "AppxMetadataAppxBundleManifest.xml";
//       } else {
//         manifestPath = "AppxManifest.xml";
//       }
//       manifestPath = path.join(element.InstalledLocation.Path, manifestPath);
//
//       var xml = fs.readFileSync(manifestPath, "utf8");
//
//       var apxApp;
//       var appId;
//       var name;
//
//       parseString(xml, function (err, result) {
//
//         apxApp = result.Package.Applications[0].Application[0];
//         appId = apxApp.$.Id;
//         name = result.Package.Properties[0].DisplayName;
//
//         if (name.toString().startsWith("ms-resource")) {
//           name = getIndirectResourceString(element.Id.FullName, element.Id.Name, name);
//           if (name == null || name == "") {
//             name = result.Package.Identity[0].$.Name;
//           }
//         }
//
//         console.debug(`Parsed UWP App Manifest: ${name}`);
//
//         var uwpApp: SimpleUWPApp = {} as SimpleUWPApp;
//         console.debug(`Created uwpApp variable`);
//
//         uwpApp.name = name;
//         uwpApp.workdir = element.InstalledLocation.Path;
//         uwpApp.path = "explorer.exe";
//         uwpApp.arguments = `shell:AppsFolder\\${element.Id.FamilyName}!${appId}`;
//         uwpApp.appId = element.Id.FamilyName;
//
//         console.debug(`uwpApp var = ${uwpApp}`);
//
//         uwpApps.push(uwpApp);
//
//       });
//     } catch (err) {
//       console.error("Error parsing xml files: " + err);
//     }
//   });
//
//   return uwpApps;
// }

// unused
// function getGamesLibraryNames(gamesLibraryPath: string) {
//   var gamesLibraryNames: Array<SimpleManifest> = [];
//   try {
//     fs.readdirSync(path.normalize(gamesLibraryPath)).forEach((element) => {
//       var manifestPath = path.join(
//         path.normalize(gamesLibraryPath),
//         element,
//         "Content",
//         "appxmanifest.xml"
//       );
//       var xml = fs.readFileSync(manifestPath, "utf8");
//       parseString(xml, function (err, result) {
//         var gameManifest: SimpleManifest = {} as SimpleManifest;
//         gameManifest.idName = result.Package.Identity[0].$.Name;
//         gameManifest.idPublisher = result.Package.Identity[0].$.Publisher;
//         gameManifest.appExecutable = result.Package.Applications[0].Application[0].$.Executable;
//         gamesLibraryNames.push(gameManifest);
//       });
//     });
//   } catch (err) {
//     console.error("Error getting games in library path: " + err.toString());
//   }
//   console.debug(`Found ${gamesLibraryNames.length} games in library path ${gamesLibraryPath}`);
//   return gamesLibraryNames;
// }

