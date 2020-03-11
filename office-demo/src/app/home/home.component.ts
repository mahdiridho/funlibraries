import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html'
})
export class HomeComponent {
  mapboxProfile: any = {
    accessToken: environment.mapboxToken,
    scale: 0.4,
    center: [104.1107883,1.151522],
    gltfPath: '/assets/mapbox/object/scene.gltf',
    tripList: []
  };
}
