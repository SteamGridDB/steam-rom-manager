import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as json from "../helpers/json";
import { spawn } from "child_process";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { SimpleUWPApp, SimpleManifest } from '../../models';
import { glob } from 'glob';

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

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }): Promise<ParsedData> {
    return new Promise<ParsedData>(async (resolve, reject) => {
      if (os.type() !== 'Windows_NT') {
        return reject(this.lang.errors.UWPNotCompatible)
      }
      try {
        const xmlParser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        });
        const UWPDir: string = inputs.UWPDir || "C:\\XboxGames";
        const files = await glob("*/{,Content/}appxmanifest.xml", { cwd: UWPDir })
        let finalData: ParsedData = {
          executableLocation: "C:\\WINDOWS\\explorer.exe",
          success: [],
          failed: []
        };
        for(let prefile of files) {
          const file = path.join(UWPDir, prefile)
          if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            const xmldata = fs.readFileSync(file, 'utf-8');
            if (XMLValidator.validate(xmldata)) {
              const parsedData: any = xmlParser.parse(xmldata);
              if (!json.caselessHas(parsedData, [["Package"], ["Properties"], ["PublisherDisplayName"]]) || json.caselessGet(parsedData, [["Package"], ["Properties"], ["PublisherDisplayName"]]) == "Microsoft Corporation") {
                continue
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
                    const gameDetail: SimpleUWPApp = await getUWPAppDetail(gameManifest, xmlParser);
                    if (gameDetail && gameDetail.name && gameDetail.appId && gameDetail.path) {
                      finalData.success.push({
                        extractedTitle: gameDetail.name,
                        launchOptions: gameDetail.arguments,
                        filePath: gameDetail.path,
                        //fileLaunchOptions: not available
                      })
                    }
                  }
                }
              }
            }
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

// inspired by https://github.com/JosefNemec/Playnite/blob/master/source/Playnite/Common/Resources.cs
const getIndirectResourceString= async (fullName: string, packageName: string, resource: string) => {
  const lastSegment = new URL(resource).pathname.split("/").reverse()[0];
  let resourceString: string;
  if (resource.toString().startsWith("ms-resource://")) {
    resourceString = `@{${fullName}? ${resource}}`;
  } else if (resource.toString().includes("/")) {
    const cleanResource = resource.toString().replace("ms-resource:", "").replace(/^\/+/, "").replace(/\/+$/, "");
    resourceString = `@{${fullName}? ms-resource://${packageName}/${cleanResource}}`;
  } else {
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
      `;
    fs.writeFileSync(psScriptPath, psScriptContent);
  } catch (err) {
    console.error(err);
  }
  try {
    const result: string = await new Promise((resolve) => {
      const out = spawn(psScriptPath, ['-pszSource', `"${resourceString}"`], {shell: 'powershell'}).stdout;
      out.on('data', (data) => resolve(data.toString('utf8')))
      out.on('close', ()=>resolve(''))
    })
    if (result) {
      const jsonResult = JSON.parse(result);
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
    const result:string = await new Promise((resolve) => {
      const out = spawn(psScriptPath, ['-pszSource', `"${resourceString}"`], {shell: 'powershell'}).stdout;
      out.on('data', data => resolve(data.toString('utf8')))
      out.on('close', () => resolve(''))
    })
    if (result) {
      const jsonResult = JSON.parse(result);
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

const getUWPAppDetail = async (manifest: SimpleManifest, xmlParser: XMLParser) => {
  let uwpApp: SimpleUWPApp = {} as SimpleUWPApp;
  const command = `$PkgMgr = [Windows.Management.Deployment.PackageManager,Windows.Web,ContentType=WindowsRuntime]::new();
  $package = $PkgMgr.FindPackagesForUser([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value, "${manifest.idName}", "${manifest.idPublisher}");
  $newObject = $package | Select-Object IsFramework, IsResourcePackage, SignatureKind, IsBundle, InstalledLocation, InstalledPath, Id;
  $newObject | ConvertTo-Json`
  const searchResults:string = await new Promise((resolve)=>{
    const out = spawn(command,{shell: 'powershell'}).stdout;
    out.on('data', data => resolve(data.toString('utf8')))
    out.on('close',() => resolve(''))
  })
  if (!searchResults) { return }
  const jsonuwpapp = JSON.parse(searchResults);
  if (
    jsonuwpapp.IsFramework ||
    jsonuwpapp.IsResourcePackage ||
    jsonuwpapp.SignatureKind != 3 // https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.packagesignaturekind
  ) {
    return;
  }
  try {
    let manifestPath;
    if (jsonuwpapp.IsBundle) {
      manifestPath = "AppxMetadataAppxBundleManifest.xml";
    } else {
      manifestPath = "AppxManifest.xml";
    }
    let installedDir = jsonuwpapp.InstalledLocation ? jsonuwpapp.InstalledLocation.Path : jsonuwpapp.InstalledPath;
    manifestPath = path.join(installedDir, manifestPath);
    let xml = fs.readFileSync(manifestPath, "utf8");
    let apxApp: string;
    let appId: string;
    let name: string;
    if (XMLValidator.validate(xml)) {
      let parsedData: any = xmlParser.parse(xml);
      apxApp = json.caselessGet(parsedData, [["Package"], ["Applications"], ["Application"]]);
      if (Array.isArray(apxApp)) {
        apxApp = apxApp.filter(x => json.caselessHas(x, [["@_Executable"]]))[0];
      }
      appId = json.caselessGet(apxApp, [["@_Id"]]);
      name = json.caselessGet(parsedData, [["Package"], ["Properties"], ["DisplayName"]]);
      if (name.toString().startsWith("ms-resource")) {
        name = await getIndirectResourceString(jsonuwpapp.Id.FullName, jsonuwpapp.Id.Name, name);
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