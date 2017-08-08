import * as fs from "fs-extra";

export function readJson<valueType>(filename: string, fallbackValue: valueType, segments?: string[]) {
    return new Promise<valueType>((resolve, reject) => {
        fs.readFile(filename, 'utf8', (error, data) => {
            try {
                if (error) {
                    if (error.code === 'ENOENT')
                        resolve(fallbackValue);
                    else
                        reject(error);
                }
                else {
                    if (data) {
                        let parsedData = JSON.parse(data);

                        if (parsedData !== undefined) {
                            if (segments) {
                                let segmentData = parsedData;
                                for (let i = 0; i < segments.length; i++) {
                                    if (segmentData[segments[i]] !== undefined) {
                                        segmentData = segmentData[segments[i]];
                                    }
                                    else
                                        resolve(fallbackValue);
                                }
                                resolve(segmentData);
                            }
                            else
                                resolve(parsedData);
                        }
                    }
                    else
                        resolve(fallbackValue);
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

export function writeJson(filename: string, value: any, segments?: string[]) {
    return Promise.resolve().then(() => {
        if (segments !== undefined)
            return readJson(filename, {});
        else
            return {};
    }).then((readData) => {
        if (segments !== undefined) {
            let segmentLadder = readData;
            for (let i = 0; i < segments.length - 1; i++) {
                if (segmentLadder[segments[i]] === undefined) {
                    segmentLadder[segments[i]] = {};
                }
                segmentLadder = segmentLadder[segments[i]];
            }
            segmentLadder[segments[segments.length - 1]] = value;
        }
        else
            readData = value;


        return new Promise<void>((resolve, reject) => {
            fs.outputFile(filename, JSON.stringify(readData, null, 4), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    });
}