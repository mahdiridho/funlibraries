#! /usr/bin/env node

/*!
 * Script to sanitize the package.json file after run ng-packagr
 * Mahdi Ridho
 */

"use strict";
let fs = require('fs');
let packageJson = require("./package.json");
delete packageJson.dependencies;
let newJson = JSON.stringify(packageJson);
newJson = newJson.replace(/\[/g,"\[\n").replace(/\]/g,"\n\]").replace(/{/g,"{\n").replace(/}/g,"\n}").replace(/,/g,",\n");
fs.writeFileSync("./package.json", newJson);