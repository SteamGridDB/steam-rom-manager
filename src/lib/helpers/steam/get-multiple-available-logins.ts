import { userAccountData } from "../../../models";
import { getAvailableLogins } from "./get-available-logins";

export function getMultipleAvailableLogins(steamDirectories: string[]) {
  let multipleDirData: {
    data: { [directory: string]: userAccountData[] };
    numberOfAccounts: number;
  } = { data: {}, numberOfAccounts: 0 };
  let promises: Promise<userAccountData[]>[] = [];
  for (let i = 0; i < steamDirectories.length; i++) {
    promises.push(getAvailableLogins(steamDirectories[i]));
  }
  return Promise.resolve()
    .then(() => {
      if (promises.length > 0) {
        return promises.reduce(
          (p, c, i) =>
            p.then((data) => {
              multipleDirData.data[steamDirectories[i]] = data;
              multipleDirData.numberOfAccounts += data.length;
              return c;
            }),
          Promise.resolve().then(() => promises[0]),
        );
      }
    })
    .then(() => {
      return multipleDirData;
    });
}
