import { Component, ViewChild } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { MapboxClientCore } from './mapbox-client.core';

@Component({
  selector: 'mapbox-client',
  template: `
    <div id="content-container">
      <div #mapcontent id="map"></div>
    </div>
  `,
  styles: [`
    #content-container {
      display: flex;
      flex-flow: column;
      height: 100%;
    }
    #map {
      flex-grow: 1 !important;
    }  
  `]
})
export class MapboxClient extends MapboxClientCore {
  @ViewChild('mapcontent') mapbox;
  loc: string;
  ptData: any;

  constructor(
    private diagnostic: Diagnostic,
    private navCtrl: NavController,
    private alertCtrl: AlertController
  ) {
    super();
  }

  async permissionAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Location Permission',
      message: 'The apps need location permission!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.navCtrl.back();
          }
        }, {
          text: 'Ok',
          handler: () => {
            //handle confirmation window code here and then call switchToLocationSettings
            this.diagnostic.switchToLocationSettings()

            // Listening the setting update
            this.diagnostic.registerLocationStateChangeHandler(resp=>{
              this.loc = resp;
            })
          }
        }
      ]
    })

    await alert.present();
  }

  /**
   * Always check the location setting to work with mapbox api
   */
  isLocationEnabled() {
    // Once the setting window show up, the app state is pause
    // So this event listener to check after switchToLocationSettings() complete
    document.addEventListener("resume", ()=>{
      if (this.loc == 'location_off')
        this.navCtrl.back();
      else if (this.loc == 'high_accuracy')
        this.getDeviceLocation().then(()=>{
          this.initMap(this.mapbox.nativeElement)
        })
    }, false);

    this.diagnostic.isLocationEnabled().then((isEnabled) => {
      if(!isEnabled)
        this.permissionAlert();
      else
        this.getDeviceLocation().then(data=>{
          this.initMap(this.mapbox.nativeElement)
        })
    })
  }
}
