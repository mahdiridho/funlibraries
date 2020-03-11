import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Routes, RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { MapboxClientModule } from '../mapbox-client/mapbox-client.module';

const routes: Routes = [
  {
    path: '',
    component: HomePage
  }
];

@NgModule({
  imports: [
    IonicModule,
    RouterModule.forChild(routes),
    MapboxClientModule
  ],
  declarations: [HomePage]
})
export class HomeModule {}
