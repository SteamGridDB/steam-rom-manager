import { GlobalContainer } from "../renderer/models";

export var gApp: GlobalContainer = {
    lang: undefined,
    version: require('../../package.json')['version']
};