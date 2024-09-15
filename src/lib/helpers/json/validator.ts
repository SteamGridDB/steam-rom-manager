import { ValidatorModifier } from "../../../models/helpers.model";
import Ajv, { ValidateFunction, Options } from "ajv";
import * as _ from "lodash";

export class Validator<T = object> {
  private ajv: Ajv;
  private validationFn: ValidateFunction | null = null;
  private modifier: ValidatorModifier<T> | null = null;

  constructor(
    schema?: object,
    modifier?: ValidatorModifier<T>,
    options: Options = { removeAdditional: "all", useDefaults: true },
  ) {
    this.ajv = new Ajv(Object.assign(options, { strict: false }));
    if (schema !== undefined) {
      this.setSchema(schema);
    }
    if (modifier !== undefined) {
      this.setModifier(modifier);
    }
  }

  public setSchema(schema: object) {
    if (schema) {
      this.validationFn = this.ajv.compile(schema);
    } else {
      this.validationFn = null;
    }

    return this;
  }

  public setModifier(modifier: ValidatorModifier<T>) {
    if (modifier) {
      this.modifier = modifier;
    } else {
      this.modifier = null;
    }

    return this;
  }

  public validate(data: object) {
    if (this.modifier) {
      while (this.modify(data)) {}
      _.set(data, this.modifier.controlProperty, this.modifier.latestVersion);
    }

    if (this.validationFn) {
      this.validationFn(data);
    }

    return this;
  }

  get errors() {
    if (this.validationFn) {
      return this.validationFn.errors || null;
    } else {
      return null;
    }
  }

  get errorString() {
    const errors = this.errors;
    return errors !== null ? JSON.stringify(errors, null, "\t") : "";
  }

  public isValid() {
    return this.errors === null;
  }

  public getDefaultValues() {
    const data = {};
    if (this.validationFn) {
      this.validationFn(data);
      if (this.modifier) {
        _.set(data, this.modifier.controlProperty, this.modifier.latestVersion);
      }
    }
    return data as T;
  }

  private modify(data: any) {
    const controlValue = _.get(data, this.modifier!.controlProperty, undefined);
    const modifierFieldSet = this.modifier!.fields[controlValue];
    if (modifierFieldSet) {
      for (const key in modifierFieldSet) {
        const fieldData = modifierFieldSet[key];
        const oldKey = fieldData.oldValuePath ? fieldData.oldValuePath : key;
        if (fieldData.keyMatch && fieldData.method) {
          const matchedKeys = Object.keys(data).filter((k) =>
            fieldData.keyMatch.test(k),
          );
          for (const matchedKey of matchedKeys) {
            _.set(
              data,
              matchedKey,
              fieldData.method(_.get(data, matchedKey, undefined), data),
            );
          }
        } else if (fieldData.method) {
          _.set(
            data,
            key,
            fieldData.method(_.get(data, oldKey, undefined), data),
          );
        } else {
          _.set(data, key, _.get(data, oldKey, undefined));
        }
      }
      return !_.isEqual(
        controlValue,
        _.get(data, this.modifier!.controlProperty, undefined),
      );
    } else {
      return false;
    }
  }
}
