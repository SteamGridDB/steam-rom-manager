export interface UserExceptionsTitles {
    [title: string] : {
      newTitle: string,
      searchTitle: string,
      commandLineArguments: string,
      exclude: boolean
    }
}
export interface UserExceptions {
  exceptionsVersion?: number,
  titles: UserExceptionsTitles
};
