import * as fs from "fs-extra";

function readJson<valueType>(filename: string, fallbackValue: valueType, segments?: string[]) {
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