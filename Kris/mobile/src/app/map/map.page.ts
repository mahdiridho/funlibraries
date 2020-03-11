import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import * as mapboxgl from 'mapbox-gl';
declare var AWS, Threebox;
import 'src/assets/mapbox/js/threebox.js';
import 'aws-sdk/dist/aws-sdk.min';

@Component({
  selector: 'app-map',
  template: `
    <div id="content-container">
      <div #mapcontent id="map"></div>
      <ion-button expand="block" color="primary" [disabled]="startBtn" (click)="startTrip()">Start Trip</ion-button>
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
export class MapPage implements OnInit {
  startBtn = true;
  map: any; // mapbox object
  devicePos: any; // The coordinate of current device position
  tb: any; // threebox instance
  layerObj: any; // List of the vehicle objects
  directionOpt: any;
  directionLine: any;
  devId = new Date().getTime();
  destination: any;
  sqs: any;
  loc: string;
  @ViewChild('mapcontent') mapbox;


  constructor(
    private diagnostic: Diagnostic,
    private alertCtrl: AlertController
  ) {
    // for development purpose, to work with local properties on debugging
    eval("window.myService=this;")
  }

  ngOnInit() {
    // Init the mapbox
    // We load both js & css and insert them to the head index
    // import <js_module> way didn't work
    // Init the mapbox css style
    // We load css and insert them to the head index
    // load css file here instead of on index.html, this way is possible to create object oriented in the future
    let mapboxCss = "assets/mapbox/css/mapbox-gl.css";
    this.loadCSS(mapboxCss, ()=>{
      AWS.config.update({
        region: "ap-southeast-1"
      })
      let cognitoParam = {
        'IdentityPoolId': "ap-southeast-1:efdeedb8-ebce-41a6-b151-f1494fdecea2"
      }
  
      AWS.config.credentials=new AWS.CognitoIdentityCredentials(cognitoParam);
      let gp=AWS.config.credentials.getPromise();
      gp.then(()=>{
        console.log('getCredentials done: ',AWS.config.credentials.identityId)
        this.sqs = new AWS.SQS();
        this.isLocationEnabled();
      }).catch((err)=>{
        console.log('AWS.config.credentials.get')
        console.log("Error login : ", err);
      })
    })
  }

  /** Load a mapbox css file
  \param url the source of the css file
  \param onLoadFn The function to run once the file has loaded.
  */
  loadCSS(url, onLoadFn){
    let cssLink = document.createElement('link');
    cssLink.onload = onLoadFn;
    cssLink.rel = "stylesheet";
    cssLink.href = url;
    document.head.appendChild(cssLink);
  }

  async permissionAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Location Permission',
      message: 'The app need location permission!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.permissionAlert();
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
   * Overload this method once the libraries loaded
   */
  isLocationEnabled() {
    // Once the setting window show up, the app state is pause
    // So this event listener to check after switchToLocationSettings() complete
    document.addEventListener("resume", ()=>{
      console.log(this.loc)
      if (this.loc == 'location_off')
        this.permissionAlert();
      else if (this.loc == 'high_accuracy')
        this.getDeviceLocation().then((data: any)=>{
          this.devicePos = [data.coords.longitude, data.coords.latitude];
          this.sendMessage("position "+this.devId+" "+JSON.stringify(this.devicePos)).then(()=>{
            this.initMap();
          })
        })
    }, false);

    this.diagnostic.isLocationEnabled().then((isEnabled) => {
      if(!isEnabled)
        this.permissionAlert();
      else
        this.getDeviceLocation().then((data: any)=>{
          this.devicePos = [data.coords.longitude, data.coords.latitude];
          this.sendMessage("position "+this.devId+" "+JSON.stringify(this.devicePos)).then(()=>{
            this.initMap();
          })
        })
    })
  }
  
  /**
   * Get the current coordinate of the device
   * Using navigator instead of ionic geolocation on ionic apps, to work with geoLocationOptions
   */
  getDeviceLocation() {
    return new Promise((resolve, reject)=>{
      navigator.geolocation.getCurrentPosition(
        (data) => {
          console.log("GET DATA : ", data)
          return resolve(data)
        }, (error) => {
          console.log('Error getting location', error);
          return reject()
        }, { maximumAge:0, enableHighAccuracy: true }
      )
    })
  }

  sendMessage(msg) {
    console.log('sendMessage entered')
    let message = {
      MessageBody: msg,
      QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/750093126151/mapbox_truck_mobile"
    }
    return this.sqs.sendMessage(message).promise().then(()=>{
      console.log("SQS message sent")
    }).catch((err)=>{ // catch non-existant queue error and send failures
      console.log("SQS message fails : "+err.code);
    })
  }

  /** Waiting for sqs notif
  */
  getMessage(){
    // Params sqs receive messages
    let receive = {
      QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/750093126151/mapbox_truck_office",
      MaxNumberOfMessages: 1,
      VisibilityTimeout: 0,
      WaitTimeSeconds: 20
    }

    this.sqs.receiveMessage(receive).promise().then((data)=>{
      console.log(data.Messages)
      if (data.Messages.length>0) {
        console.log("SQS notif: "+ data.Messages[0].Body);

        let delParam = {
          QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/750093126151/mapbox_truck_office",
          ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        // Delete current SQS message
        console.log("Deleting the existing SQS message")
        if (data.Messages[0].Body.indexOf(this.devId) < 0)
          this.getMessage()
        else
          this.sqs.deleteMessage(delParam).promise().then(()=>{
            let destination = data.Messages[0].Body.split(" ")[2];
            this.destination = JSON.parse(destination);
            this.travelPath();
          })
      } else
        this.getMessage();
    }).catch((err)=>{
      console.log(err.code);
      this.getMessage()
    })
  }

  /**
   * Init the mapbox and starting coordinate, it will init the rendering 3d obj marker too
   */
  initMap() {
    console.log("init map")
    
    // Init the mapbox
    mapboxgl.accessToken = "pk.eyJ1IjoibWJhbWFzIiwiYSI6ImNqeGZpbzJtczBicHMzb21rajU0dHA1dTEifQ.w8BlVdt6Qhf9B_e6-0GTgA";
    this.map = new mapboxgl.Map({
      container: this.mapbox.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.devicePos,
      zoom: 15,
      pitch: 60,
      antialias: true
    })

    this.initLayer();
  }

  /**
   * Init the map layer for the trips
   * Init the threebox module and add the first 3D vehicle object to threebox
   */
  initLayer() {
    console.log("init layer")
    this.map.on('style.load', ()=>{
      this.map.addLayer({
        id: "trips_layer",
        type: 'custom',
        renderingMode: '3d',
        onAdd: (map, mbxContext)=>{
          this.tb = new Threebox(
            map, 
            mbxContext,
            {defaultLights: true}
          );

					// import truck from an external obj file, scaling up its size 10x
					var options = {
						obj: '/assets/mapbox/object/Truck.obj',
						mtl: '/assets/mapbox/object/Truck.mtl',
						scale: 10
					}
					this.tb.loadObj(options, (model)=>{
						this.layerObj = model.setCoords(this.devicePos);
            this.tb.add(this.layerObj);
            this.map.flyTo({center:this.devicePos});
            this.getMessage();
					})
        },
    
        render: (gl, matrix)=>{
          this.tb.update();
        }
      })
    }).on('click', (e)=>{
      // Dont remove it
      // It is for development purpose to get the coordinate
      console.log([e.lngLat.lng, e.lngLat.lat])
    })
  }

  /**
   * Set the route direction line
   * @param destination Direction trip data
   */
  travelPath() {
    // request directions. See https://docs.mapbox.com/api/navigation/#directions for details
    let url = "https://api.mapbox.com/directions/v5/mapbox/driving/"+[this.devicePos, this.destination].join(';')+"?geometries=geojson&access_token=" + mapboxgl.accessToken
    this.fetchFunction(url, (data)=>{
      console.log("Direction: ", data)
      // extract path geometry from callback geojson, and set duration of travel
      this.directionOpt = {
        path: data.routes[0].geometry.coordinates,
        duration: data.routes[0].duration * 1000
      }
      // set up geometry for a line to be added to map, lofting it up a bit for *style*
      let lineGeometry = this.directionOpt.path.map((coordinate)=>{
        return coordinate.concat([15])
      })
      // create and add line object
      this.directionLine = this.tb.line({
        geometry: lineGeometry,
        width: 5,
        color: 'steelblue'
      })
      this.tb.add(this.directionLine);
      this.boundMap();
      this.startBtn = false;
    })
  }

  boundMap() {
    // Fit to the bounds of a LineString
    let bounds = this.directionOpt.path.reduce((bounds, coord)=>{
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(this.directionOpt.path[0], this.directionOpt.path[0]));
    this.map.fitBounds(bounds, {
      padding: 20
    })
  }

  /**
   * start the trip animation and remove the line when animation ends
   */
  startTrip() {
    if (!this.startBtn)
      this.startBtn = true;
    this.layerObj.followPath(this.directionOpt, ()=>{
      console.log("Followpath: ", this.directionLine)
      if (this.directionOpt.duration <= 10000)
        this.tb.remove(this.directionLine);
    })
    if (this.directionOpt.duration > 10000)
      this.syncPosition();
  }

  syncPosition() {
    this.getDeviceLocation().then((data: any)=>{
      this.devicePos = [data.coords.longitude, data.coords.latitude];
      let url = "https://api.mapbox.com/directions/v5/mapbox/driving/"+[this.devicePos, this.destination].join(';')+"?geometries=geojson&access_token=" + mapboxgl.accessToken
      this.fetchFunction(url, (data)=>{
        console.log("Direction: ", data)
        // extract path geometry from callback geojson, and set duration of travel
        this.layerObj.setCoords(this.devicePos);
        this.map.flyTo({center:this.devicePos});
        this.directionOpt = {
          path: data.routes[0].geometry.coordinates,
          duration: data.routes[0].duration * 1000
        }
        this.sendMessage("update "+this.devId+" "+JSON.stringify(this.devicePos)+" "+this.directionOpt.duration+" "+JSON.stringify(this.directionOpt.path)).then(()=>{
          this.startTrip();
        })
      })
    })
  }

  fetchFunction(url, cb) {
    fetch(url).then((response)=>{
      if (response.status === 200)
        response.json().then((data)=>{
          cb(data)
        })
    })
  }

}
