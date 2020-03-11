import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapboxClient } from './mapbox-client.component';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [Diagnostic],
  declarations: [MapboxClient],
  exports: [MapboxClient]
})
export class MapboxClientModule { }
