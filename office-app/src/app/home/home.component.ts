import { Component, OnInit } from '@angular/core';
import 'mapbox-client/mapbox-client.js';

@Component({
  selector: 'app-home',
  template: `
  <div [style.height]="sizeChange">
    <mapbox-client [initData]="initData"></mapbox-client>
  </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  initData: any;
  sizeChange = window.innerHeight-20+"px";

  constructor() { }

  ngOnInit() {
    this.initData = {
      accessToken: "pk.eyJ1IjoibWJhbWFzIiwiYSI6ImNqeGZpbzJtczBicHMzb21rajU0dHA1dTEifQ.w8BlVdt6Qhf9B_e6-0GTgA",
      scale: 0.4,
      center: [104.1107883,1.151522],
      gltfPath: '/assets/scene.gltf',
      tripList: [
        {
          LeadingKey: 'driver',
          SortKey: 'truck_01',
          destinationB: [
            104.1044242356117,
            1.1837301193229735
          ],
          positionA: [
            104.1021977,
            1.1853486
          ]
        }
      ]
    }
  }
}
