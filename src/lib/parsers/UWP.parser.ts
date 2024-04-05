import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as json from "../helpers/json";
import { spawnSync } from "child_process";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { glob } from "glob";

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
          placeholder: this.lang.UWPDirPlaceholder,
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
        return reject(this.lang.errors.UWPNotCompatible)
      }

      const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      const UWPDir: string = inputs.UWPDir || "C:\\XboxGames";
      glob("*/{,Content/}appxmanifest.xml", { cwd: UWPDir })
        .then((files: string[]) => {
          files.forEach((file: string) => {
            file = path.join(UWPDir, file)
            if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
              const xmldata = fs.readFileSync(file, 'utf-8');
              if (XMLValidator.validate(xmldata)) {
                const parsedData: any = xmlParser.parse(xmldata);
                if (!json.caselessHas(parsedData, [["Package"], ["Properties"], ["PublisherDisplayName"]]) || json.caselessGet(parsedData, [["Package"], ["Properties"], ["PublisherDisplayName"]]) == "Microsoft Corporation") {
                  return;
                }
                if (json.caselessHas(parsedData, [["Package"], ["Applications"], ["Application"]])) {
                  let app: any = json.caselessGet(parsedData, [["Package"], ["Applications"], ["Application"]]);
                  if (Array.isArray(app)) {
                    app = app.filter(x => json.caselessHas(x, [["@_Executable"]]))[0]
                  }
                  if (json.caselessHas(app, [["@_Executable"]])) {
                    const gameManifest: SimpleManifest = {
                      idName: json.caselessGet(parsedData, [["Package"], ["Identity"], ["@_Name"]]),
                      idPublisher: json.caselessGet(parsedData, [["Package"], ["Identity"], ["@_Publisher"]]),
                      appExecutable: json.caselessGet(app, [["@_Executable"]])
                    } as SimpleManifest;
                    if (gameManifest.idName && gameManifest.idPublisher && gameManifest.appExecutable) {
                      var gameDetail: SimpleUWPApp = getUWPAppDetail(gameManifest, xmlParser);
                      if (gameDetail && gameDetail.name && gameDetail.appId && gameDetail.path) {
                        appTitles.push(gameDetail.name);
                        appIds.push(gameDetail.appId);
                        appPaths.push(gameDetail.path);
                        appArgs.push(gameDetail.arguments);
                      }
                    }
                  }
                }
              }
            }
          })
        })
        .then(() => {
          let parsedData: ParsedData = {
            executableLocation: "C:\\WINDOWS\\explorer.exe",
            success: [],
            failed: []
          };
          for (let i = 0; i < appTitles.length; i++) {
            parsedData.success.push({
              extractedTitle: appTitles[i],
              launchOptions: appArgs[i],
              filePath: appPaths[i]
            });
          }
          resolve(parsedData);
        }).catch((err: string) => {
          reject(this.lang.errors.fatalError__i.interpolate({ error: err }));
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
    if (result) {
      jsonResult = JSON.parse(result);
      if (jsonResult.intValue === 0) {
        return jsonResult.stringValue;
      }
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
    if (result) {
      jsonResult = JSON.parse(result);
      if (jsonResult.intValue === 0) {
        return jsonResult.stringValue;
      }
    }
  }
  catch (err) {
    console.error("Error parsing json: " + err);
  }

  return '';
}

function getUWPAppDetail(manifest: SimpleManifest, xmlParser: XMLParser) {
  var uwpApp: SimpleUWPApp = {} as SimpleUWPApp;

  const command = `$PkgMgr = [Windows.Management.Deployment.PackageManager,Windows.Web,ContentType=WindowsRuntime]::new();
  $package = $PkgMgr.FindPackagesForUser([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value, "${manifest.idName}", "${manifest.idPublisher}");
  $newObject = $package | Select-Object IsFramework, IsResourcePackage, SignatureKind, IsBundle, InstalledLocation, InstalledPath, Id;
  $newObject | ConvertTo-Json`

  const searchResults = spawnSync(
    command,
    {
      shell: 'powershell',
      encoding: "utf-8",
    }
  ).stdout;
  if (!searchResults)
    return;
  const jsonuwpapp = JSON.parse(searchResults);

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
    let installedDir = jsonuwpapp.InstalledLocation ? jsonuwpapp.InstalledLocation.Path : jsonuwpapp.InstalledPath;
    manifestPath = path.join(installedDir, manifestPath);

    var xml = fs.readFileSync(manifestPath, "utf8");

    var apxApp: string;
    var appId: string;
    var name: string;
    if (XMLValidator.validate(xml)) {
      let parsedData: any = xmlParser.parse(xml);
      apxApp = json.caselessGet(parsedData, [["Package"], ["Applications"], ["Application"]]);
      if (Array.isArray(apxApp)) {
        apxApp = apxApp.filter(x => json.caselessHas(x, [["@_Executable"]]))[0];
      }

      appId = json.caselessGet(apxApp, [["@_Id"]]);
      name = json.caselessGet(parsedData, [["Package"], ["Properties"], ["DisplayName"]]);

      if (name.toString().startsWith("ms-resource")) {
        name = getIndirectResourceString(jsonuwpapp.Id.FullName, jsonuwpapp.Id.Name, name);
        if (name == null || name == "") {
          name = json.caselessGet(parsedData, [["Package"], ["Identity"], ["@_Name"]]);
        }
      }

      uwpApp.name = name;
      uwpApp.workdir = installedDir;
      uwpApp.path = path.join(installedDir, manifest.appExecutable).toString();
      uwpApp.arguments = `shell:AppsFolder\\${jsonuwpapp.Id.FamilyName}!${appId}`;
      uwpApp.appId = jsonuwpapp.Id.FamilyName;

    }
  } catch (err) {
    console.error("Error parsing xml files: " + err);
  }
  return uwpApp;
}
