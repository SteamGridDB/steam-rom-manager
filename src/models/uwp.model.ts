// extracted data
export interface SimpleUWPApp {
    name: string,
    workdir: string,
    path: string,
    arguments: string,
    appId: string
  }
  
// xml manifest data
export interface SimpleManifest {
idName: string,
idPublisher: string,
appExecutable: string
}
  
// json package manager data
export interface UWPObj {
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