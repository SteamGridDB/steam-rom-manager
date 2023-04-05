import * as paths from "../paths";
import * as fs from 'fs-extra';
import * as path from 'path';
const { glob } = require("glob");
import * as _ from 'lodash';

export class ThemeManager {
  private currentThemeField: string = 'currentTheme';
  private colorRules = {};

  readFromColorFile(themeTitle: string, silentNotFound: boolean) {
    this.colorRules = {};

    return new Promise<boolean>((resolve, reject) => {
      fs.readFile(path.join(paths.userThemesDir, themeTitle + '.json'), 'utf8', (error, data) => {
        try {
          if (error) {
            if (error.code === 'ENOENT' && !silentNotFound || error.code !== 'ENOENT')
              reject(error);
            else
              resolve(false);
          }
          else {
            let isColor = require('is-color');
            let colorRules = JSON.parse(data);
            let prefixedStyles = {};
            for (let key in colorRules) {
              let colorLessKey = key.replace('--color-', '');
              if (isColor(colorRules[key]))
                this.colorRules[colorLessKey] = colorRules[key];
            }
            resolve(true);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  saveToColorFile(themeTitle: string) {
    return new Promise<boolean | void>((resolve, reject) => {
      fs.outputFile(path.join(paths.userThemesDir, themeTitle + '.json'), JSON.stringify(this.colorRules, null, 4), (err) => {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
  }

  deleteColorFile(themeTitle: string) {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(path.join(paths.userThemesDir, themeTitle + '.json'), (error) => {
        if (error)
          reject(error);
        else
          resolve();
      });
    });
  }

  saveToDevColorFile() {
    return new Promise<boolean | void>((resolve, reject) => {
      let newDevFilePath = path.join(path.dirname(paths.devThemePath), 'oldThemes', new Date().getTime() + path.extname(paths.devThemePath));
      fs.ensureDir(path.dirname(newDevFilePath), (error) => {
        if (error)
          reject(error);
        else {
          fs.rename(paths.devThemePath, newDevFilePath, (error) => {
            if (error)
              reject(error);
            else {
              fs.writeFile(paths.devThemePath, this.getCssString('    '), {encoding: "utf8"}, (err: any) => {
                if (err)
                  reject(error);
                else
                  resolve();
              });
            }
          });
        }
      });
    });
  }

  readFromStylesheets(selectorText: string) {
    let colorRules: { [rule: string]: string } = {};
    let css = document.styleSheets;
    for (let i = 0; i < css.length; i++) {
      let sheet = <CSSStyleSheet>css[i];
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          let sheetRule = <CSSStyleRule>sheet.cssRules[j];
          if (sheetRule instanceof CSSStyleRule && sheetRule.selectorText === selectorText) {
            _.merge(colorRules, this.extractCustomProperties(sheetRule.cssText));
          }
        }
      }
    }
    this.colorRules = colorRules;
  }

  readThemeTitle(silentNotFound: boolean) {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(paths.userSettings, 'utf8', (error, data) => {
        try {
          if (error) {
            if (error.code === 'ENOENT' && !silentNotFound || error.code !== 'ENOENT')
              reject(error);
            else
              resolve(undefined);
          }
          else {
            resolve(JSON.parse(data)[this.currentThemeField]);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  saveThemeTitle(themeTitle: string) {
    return new Promise<void>((resolve, reject) => {
      fs.readFile(paths.userSettings, 'utf8', (error, data) => {
        try {
          if (error) {
            if (error.code !== 'ENOENT')
              return reject(error);
          }

          let fileData = {};

          if (data)
            fileData = JSON.parse(data);

          fileData[this.currentThemeField] = themeTitle;

          fs.outputFile(paths.userSettings, JSON.stringify(fileData, null, 4), (error) => {
            if (error)
              reject(error);
            else
              resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  getAvailableThemes(): Promise<string[]> {
    return glob('*.json', { cwd: paths.userThemesDir }).then((files: string[]) => {
      for (let i = 0; i < files.length; i++) {
        files[i] = path.basename(files[i], '.json');
      }
      return files;
    })
  }

  getCssString(indent: string) {
    let toCss = require('to-css');
    return toCss({ ':root': this.prefixColorRules() }, { indent: indent });
  }

  updateValuesFromDOM() {
    let colorValue = null;
    for (let key in this.colorRules) {
      colorValue = document.documentElement.style.getPropertyValue('--color-' + key);
      if (colorValue)
        this.colorRules[key] = colorValue;
    }
  }

  getColorRules() {
    return this.colorRules;
  }

  getColorRuleValue(colorRule: string) {
    return this.colorRules[colorRule];
  }

  injectColorRules() {
    let styleElement = this.getStyleElement();
    styleElement.innerHTML = this.getCssString('');
  }

  removeInjectedColorRules(){
    let styleElement = this.getStyleElement();
    styleElement.remove();
  }

  private getStyleElement() {
    let element = <HTMLStyleElement>document.getElementById('userStyle');
    if (element === null) {
      let head = document.head;
      element = document.createElement('style');

      element.id = 'userStyle';

      let styleTags = document.head.getElementsByTagName('style');
      if (styleTags.length)
        head.insertBefore(element, styleTags[0]);
      else
        head.appendChild(element);
    }
    return element;
  }

  private extractCustomProperties(cssText: string) {
    let extractedProperties: { [rule: string]: string } = {};
    let regExpr = /--color-(.+?):\s*(.+?);/g;
    let match = null;
    let namesToHex = require('colornames');
    while ((match = regExpr.exec(cssText)) !== null) {
      extractedProperties[match[1]] = (<string>(match[2] === 'transparent' ? 'rgba(0, 0, 0, 0)' : (namesToHex(match[2]) === undefined ? match[2] : namesToHex(match[2])))).toLowerCase().replace(/\s+/g, '');
    }
    return extractedProperties;
  }

  private prefixColorRules() {
    let cssObject: { [rule: string]: string } = {};

    for (let key in this.colorRules) {
      cssObject['--color-' + key] = this.colorRules[key];
    }

    return cssObject;
  }
}
