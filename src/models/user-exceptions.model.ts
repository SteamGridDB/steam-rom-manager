export interface UserExceptionData {
  newTitle: string,
  searchTitle: string,
  timeStamp: number,
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


/* Data Flow:
 * Input: Parsers
 * Input: User Exceptions (can change title => change in app id)
 * Execute File Parser (exceptions applied on app id)
 * Preview Data
 * Preview Data Exceptions (exception saved based on title, possibly changes title)
 * Save to Steam */

// There is a data loop!
