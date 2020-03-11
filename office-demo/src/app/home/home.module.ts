import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MapboxClient } from '@hyperhaul/mapbox-client';
import { HomeComponent } from './home.component';

@NgModule({
  imports: [
    CommonModule,
    MapboxClient,
    RouterModule.forChild([
      {
        path: '',
        component: HomeComponent
      }
    ])
  ],
  declarations: [HomeComponent]
})
export class HomePageModule {}
