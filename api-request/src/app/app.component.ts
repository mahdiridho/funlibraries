import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'api-request';
  baseUrl = "https://dev.hyperhaul.com";
  isReady = false;
  @ViewChild('api') api;

  listener(e) {
    if (e == "ready")
      this.isReady = true;
  }

  signin() {
    this.api.service.call("post", "/api/auth/login/", 
      {
        username: "mahdi", 
        password: "Trial@1234"
      },
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    ).subscribe(res=>console.log(res), err=>console.log(err))
  }
}
