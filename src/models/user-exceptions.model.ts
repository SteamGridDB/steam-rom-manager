export interface UserExceptionData {
  newTitle: string,
  searchTitle: string,
  commandLineArguments: string,
  exclude: boolean,
  excludeArtwork: boolean
}

export interface UserExceptionsTitles {
  [title: string] : UserExceptionData
}
export interface UserExceptions {
  exceptionsVersion?: number,
  titles: UserExceptionsTitles
};
