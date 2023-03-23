import * as _ from "lodash";
import { markdowns } from './markdowns';
import { languageStruct } from '../../models'
let langStrings = require("./langStrings.json")
let langData: languageStruct =  _.merge(langStrings, markdowns) as languageStruct;
export default langData;
