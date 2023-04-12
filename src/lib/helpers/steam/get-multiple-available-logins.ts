import { userAccountData } from "../../../models";
import { getAvailableLogins } from "./get-available-logins";

export function getMultipleAvailableLogins(steamDirectories: string[], useCredentials: boolean | boolean[]) {
    let multipleDirData: { data: { [directory: string]: userAccountData[] }, numberOfAccounts: number } = { data: {}, numberOfAccounts: 0 };
    let promises: Promise<userAccountData[]>[] = [];
    let isArray = useCredentials instanceof Array;

    for (let i = 0; i < steamDirectories.length; i++) {
        promises.push(getAvailableLogins(steamDirectories[i], useCredentials instanceof Array ? (useCredentials[i] || false) : useCredentials || false));
    }

    return Promise.resolve().then(() => {
        if (promises.length > 0) {
            return promises.reduce((p, c, i) => p.then((data) => {
                multipleDirData.data[steamDirectories[i]] = data;
                multipleDirData.numberOfAccounts += data.length;
                return c;
            }), Promise.resolve().then(() => promises[0]));
        }
    }).then(() => {
        return multipleDirData;
    });
}
