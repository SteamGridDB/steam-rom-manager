export interface ControllerTemplate {
  title: string,
  mappingId: string,
  profileType: string
}

export interface Controllers {
  [controllerType: string]: ControllerTemplate
}

export interface ControllerTemplates {
  [steamDirectory: string]: {
    [controllerType: string]: ControllerTemplate[]
  }
}
