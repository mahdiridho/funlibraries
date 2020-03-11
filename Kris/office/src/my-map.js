/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import './shared-styles.js';
window.map = {};
window.v3 = null;
window.vertex = null;
window.matLine = null;
window.key = null;
import 'mapbox-gl/dist/mapbox-gl';
import '../threebox.js';

class MyMap extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;
          padding: 10px;
        }
        .card {
          @apply --layout-fit;
          padding: 0;
          margin: 0;
        }
        paper-button {
          background-color: var(--paper-orange-300);
          max-height: 30px;
          padding: 5px;
          font-size: 12px;
        }
        #content-container {
          @apply --layout-horizontal;
          height: 100%;
        }
        #mapcontent {
          @apply --layout-flex;
          height: 100%;
        }
        #control {
          background-color: #fff;
          padding: 5px;
          position: fixed;
          bottom: 10px;
        }
        .horizontal {
          @apply --layout-horizontal;
          @apply --layout-center;
        }
      </style>

      <div class="card">
        <div id="content-container">
          <div id="mapcontent"></div>
        </div>
      </div>
      <div id="control">
        <div class="horizontal">
          <paper-dropdown-menu label="Driver" no-animations>
            <paper-listbox id="driver" slot="dropdown-content" class="dropdown-content">
              <template is="dom-repeat" items="[[listDriver]]">
                <paper-item value="[[item.driverId]]">Driver [[setName(index)]]</paper-item>
              </template>
            </paper-listbox>
          </paper-dropdown-menu>
          <paper-input id="destination" placeholder="Destination" disabled=true></paper-input>
          <paper-button on-tap="setTrip" disabled="{{destinationBtn}}">Set Destination</paper-button>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      listDriver : {
        type: Array,
        value: []
      },
      tbObj: Object,
      listObj: {
        type: Array,
        value: []
      },
      directionLine: {
        type: Array,
        value: []
      },
      directionOpt: {
        type: Array,
        value: []
      },
      numRemove: {
        type: Number,
        value: 0
      },
      destinationBtn: {
        type: Boolean,
        value: true
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
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
      this.loadCSS("../mapbox-gl.css", ()=>{
        this.isLocationEnabled();
      })
    }).catch((err)=>{
      console.log('AWS.config.credentials.get')
      console.log("Error login : ", err);
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

  /**
   * Always check the location setting to work with mapbox api
   */
  isLocationEnabled() {
    this.getDeviceLocation().then((data)=>{
      this.devicePos = [data.coords.longitude, data.coords.latitude];
      this.initMap()
    })
  }

  /**
   * Init the mapbox and starting coordinate, it will init the rendering 3d obj marker too
   */
  initMap() {
    console.log("init map")
      console.log("map: ",mapboxgl)
    
    // Init the mapbox
    mapboxgl.accessToken = "pk.eyJ1IjoibWJhbWFzIiwiYSI6ImNqeGZpbzJtczBicHMzb21rajU0dHA1dTEifQ.w8BlVdt6Qhf9B_e6-0GTgA";
    this.map = new mapboxgl.Map({
      container: this.$.mapcontent,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.devicePos,
      zoom: 12,
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
    this.map.on('load', ()=>{
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
            obj: '../objects/Truck.obj',
            mtl: '../objects/Truck.mtl',
            scale: 10
          }
          this.tb.loadObj(options, (model)=>{
            this.tbObj = model;
            this.getMessage();
            this.destinationBtn = false;
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
      this.$.destination.value = e.lngLat.lng+","+e.lngLat.lat
    })
  }

  /**
   * Add another 3D vehicle objects into threebox if they exist
   * Set the direction route of the trip
   */
  setTrip() {
    console.log("set trip")
    this.numRemove = 0;
    if (!this.$.driver.selected && this.$.driver.selected != 0)
      return alert("Please select the driver!")
    if (!this.$.destination.value)
      return alert("Please set the destination, click any point on the map!")

    this.playAnimation();
    this.sendMessage("destination "+ this.listDriver[this.$.driver.selected].driverId +" ["+ this.$.destination.value +"]").then(()=>{
      this.travelPath()
    })
  }

  /**
   * Play the map to see the animation movement
   */
  playAnimation() {
    setTimeout(()=>{
      console.log("Play")
      this.map.flyTo({center:this.devicePos});
      if (this.numRemove < 3)
        this.playAnimation();
    },1000)
  }

  sendMessage(msg) {
    console.log('sendMessage entered')
    let message = {
      MessageBody: msg,
      QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/750093126151/mapbox_truck_office"
    }
    return this.sqs.sendMessage(message).promise().then(()=>{
      console.log("SQS message sent")
    }).catch((err)=>{ // catch non-existant queue error and send failures
      console.log("SQS message fails : "+err.code);
    })
  }

  /**
   * Set the route direction line
   */
  travelPath() {
    let driverPos = JSON.parse(this.listDriver[this.$.driver.selected].driverPos)
    // request directions. See https://docs.mapbox.com/api/navigation/#directions for details
    let url = "https://api.mapbox.com/directions/v5/mapbox/driving/"+[driverPos, this.$.destination.value].join(';')+"?geometries=geojson&access_token=" + mapboxgl.accessToken
    this.fetchFunction(url, (data)=>{
      console.log("Direction: ", data)
      // extract path geometry from callback geojson, and set duration of travel
      this.directionOpt[this.listDriver[this.$.driver.selected].driverId] = {
        path: data.routes[0].geometry.coordinates,
        duration: data.routes[0].duration * 1000
      }
      // set up geometry for a line to be added to map, lofting it up a bit for *style*
      let lineGeometry = this.directionOpt[this.listDriver[this.$.driver.selected].driverId].path.map((coordinate)=>{
        return coordinate.concat([15])
      })
      // create and add line object
      this.directionLine[this.listDriver[this.$.driver.selected].driverId] = this.tb.line({
        geometry: lineGeometry,
        width: 5,
        color: 'steelblue'
      })
      this.tb.add(this.directionLine[this.listDriver[this.$.driver.selected].driverId]);
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

  setName(i) {
    return i+1;
  }

  /** Waiting for sqs notif
  */
  getMessage(){
    // Params sqs receive messages
    let receive = {
      QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/750093126151/mapbox_truck_mobile",
      MaxNumberOfMessages: 1,
      VisibilityTimeout: 0,
      WaitTimeSeconds: 20
    }

    this.sqs.receiveMessage(receive).promise().then((data)=>{
      console.log(data.Messages)
      if (data.Messages.length>0) {
        console.log("SQS notif: "+ data.Messages[0].Body);

        let delParam = {
          QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/750093126151/mapbox_truck_mobile",
          ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        // Delete current SQS message
        console.log("Deleting the existing SQS message")
        this.sqs.deleteMessage(delParam).promise().then(()=>{
          if (data.Messages[0].Body.indexOf("position") >= 0) {
            let driverData = {
              driverId: data.Messages[0].Body.split(' ')[1],
              driverPos: data.Messages[0].Body.split(' ')[2]
            }
            this.push('listDriver', driverData);
            this.listObj[data.Messages[0].Body.split(' ')[1]] = this.tbObj.duplicate();
            this.listObj[data.Messages[0].Body.split(' ')[1]].setCoords(JSON.parse(data.Messages[0].Body.split(' ')[2]))
            this.tb.add(this.listObj[data.Messages[0].Body.split(' ')[1]]);
            this.getMessage()
          } else if (data.Messages[0].Body.indexOf("update") >= 0) {
            console.log(data.Messages[0].Body.split(' '))
            this.listObj[data.Messages[0].Body.split(' ')[1]].setCoords(data.Messages[0].Body.split(' ')[2]);
            this.directionOpt[data.Messages[0].Body.split(' ')[1]] = {
              path: JSON.parse(data.Messages[0].Body.split(' ')[4]),
              duration: data.Messages[0].Body.split(' ')[3]
            }
            console.log("DirectionOpt: ", this.directionOpt[data.Messages[0].Body.split(' ')[1]]);
            this.listObj[data.Messages[0].Body.split(' ')[1]].followPath(
              this.directionOpt[data.Messages[0].Body.split(' ')[1]],
              ()=>{
                this.numRemove++;
                console.log("Followpath: ", this.directionLine[data.Messages[0].Body.split(' ')[1]])
                this.tb.remove(this.directionLine[data.Messages[0].Body.split(' ')[1]]);
              }
            )
            this.getMessage()
          }
        })
      } else
        this.getMessage();
    }).catch((err)=>{
      console.log(err.code);
      this.getMessage()
    })
  }
}

window.customElements.define('my-map', MyMap);
