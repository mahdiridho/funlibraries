import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  templateUrl: './home.page.html'
})
export class HomePage {
  mapboxProfile = {
    accessToken: environment.mapboxToken,
    markerId: 'honor',
    type: 'driver'
  }
}
