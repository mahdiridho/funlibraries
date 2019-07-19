import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ApiRequestModule } from './api-request/api-request.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ApiRequestModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
