import { JsonValidatorModifier } from "../models/index";
import * as fs from "fs-extra";
import * as Ajv from "ajv";
import * as _ from "lodash";

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

export class JsonValidator {
    private static ajv = new Ajv({ removeAdditional: 'all', useDefaults: true });
    private validationFn: Ajv.ValidateFunction;
    private modifier: { controlProperty: string, modifierFields: JsonValidatorModifier };

    constructor(schema?: any, modifier?: { controlProperty: string, modifierFields: JsonValidatorModifier }) {
        this.setSchema(schema);

        if (modifier !== undefined)
            this.setModifier(modifier.controlProperty, modifier.modifierFields);
    }

    setSchema(schema: any) {
        if (schema != undefined)
            this.validationFn = JsonValidator.ajv.compile(schema);
        else
            this.validationFn = undefined;
    }

    setModifier(controlProperty: string, modifierFields: JsonValidatorModifier) {
        this.modifier = { controlProperty, modifierFields };
    }

    validate(data: any) {
        if (this.modifier)
            while (this.modify(data));

        if (this.validationFn) {
            this.validationFn(data);
            return this.validationFn.errors;
        }
        else {
            return true;
        }
    }

    getDefaultValues(){
        let data = {};
        if (this.validationFn) {
            this.validationFn(data);
        }
        return data;
    }

    private modify(data: any) {
        let controlValue = _.get(data, this.modifier.controlProperty, undefined);
        let modifierFieldSet = this.modifier.modifierFields[controlValue];

        if (modifierFieldSet !== undefined) {
            for (let key in modifierFieldSet) {
                let fieldData = modifierFieldSet[key];

                if (fieldData.method)
                    _.set(data, key, fieldData.method(_.get(data, typeof fieldData.oldValuePath === 'string' ? fieldData.oldValuePath : key, undefined)));
                else if (typeof fieldData.oldValuePath === 'string')
                    _.set(data, key, _.get(data, fieldData.oldValuePath, undefined));
            }
            return !_.isEqual(controlValue, _.get(data, this.modifier.controlProperty, undefined));
        }
        else
            return false;
    }
}