# Introduction

All reusable components will be packaged to npm library.
We can reuse each libraries to every projects needed them.
We can publish them to npm as public library too.

## Goal

* Have internal properties that reusable, easy to manage and control, and simple installation
* Replace this approach :

`ng g c <component_name>`

on every projects, and change the approach to :

`npm i <package_name>`

* Make the project code more slim and readable
* Provide the package's demo to be tested

## How to create new package and run the demo

* create new demo app, e.g :

`$ ng new cognito-auth-app`

* move to the app folder and create an app feature module/component

`cognito-auth-app$ ng g m cognito-auth (generate feature module)`

`cognito-auth-app$ ng g c cognito-auth (generate feature component)`

* Remove several feature files include .spec.ts, .css, .html (optional)

* Update the component file

* Import the component to the module

* Update the root file to work with the component

## How to build the package module

Reference: [Building an Angular Component Library with the Angular CLI and ng-packagr](https://medium.com/@nikolasleblanc/building-an-angular-4-component-library-with-the-angular-cli-and-ng-packagr-53b2ade0701e)

* Create 2 files ng-package.json and public_api.ts in app demo folder (demo/<app_name>)

ng-package.json contents :

```
{
  "$schema": "./node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "public_api.ts"
  }
}
```

public_api.ts contents :

`
export * from './src/app/<module_folder>/<module_name>.module'
`

e.g : export * from './src/app/cognito-auth/cognito-auth.module'

From the repository folder, run this script :

`$ ./packagr.sh <app_demo_name>`

e.g ./packagr.sh cognito-auth-app

Once get the message "Done", we have succeed build the module. We can find the module inside folder app_name/dist. Now, from other Angular applications on our system that require the component library, we can run :

`projectApp$ npm install ng_packagr_modules/app_name/dist/<module_name>.tgz`

e.g npm install ng_packagr_modules/cognito-auth-app/dist/cognito-auth-app-1.0.0.tgz

to install the component library into our application.