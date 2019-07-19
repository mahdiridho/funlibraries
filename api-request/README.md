# ApiRequest
The module to work with API

## Quick installation
From your project app run below :

```
npm i --save api-request/dist/api-request-<version>.tgz
```

Add the module to the project app module e.g app.module.ts :

```
import { ApiRequestModule } from 'api-request';
...

imports: [
    ...
    ApiRequestModule
]
```

Finally, insert the element to the component template e.g :

```
<api-request #api (apiEvent)="listener($event)" [baseUrl]="baseUrl"></api-request>
```

To make a request :

```
Format:
this.api.service.call("post" || "get", endpoint<string>, body<any>, header<any>)

e.g
this.api.service.call("post", "/api/auth/", 
    {
        username: "user1", 
        password: "123456"
    },
    {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }).subscribe(
        result => console.log(result),
        error => console.log(error)
    )
```