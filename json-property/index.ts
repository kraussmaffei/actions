import * as core from '@actions/core';
import fs from 'fs';

function getNestedObject(nestedObj: any, pathArr: string[]) {
    return pathArr.reduce(
        (obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined),
        nestedObj
    );
}

function run() {
    const path: string = core.getInput('path');
    const prop: string[] = core.getInput('prop_path').split('.');
    const variable = prop.join('_')
    try {
        const file = fs.readFileSync(path, 'utf8')
        const json = JSON.parse(file.toString());
        const nestedProp = getNestedObject(json, prop);
        if (nestedProp) {
            core.exportVariable(variable, nestedProp);
        } else {
            core.setFailed('no value found :(');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();