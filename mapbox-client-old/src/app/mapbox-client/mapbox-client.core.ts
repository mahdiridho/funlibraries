import { OnInit, Input } from '@angular/core';
// we must declare the mapbox-gl var to fix the bug of undefined var
declare var mapboxgl, THREE, Threebox;

export class MapboxClientCore implements OnInit {
  _profile: any;
  map: any; // mapbox object
  devicePos: any; // The coordinate of current device position
  tb: any; // threebox instance
  loader: any;
  layerObj: any = [];
  directionOpt: any = [];
  directionLine: any = [];
  startDateTravel: number;

  // reset the profile data
  @Input() set mapboxProfile(mapboxProfile: any) {
    console.log("MapboxClient::resetProfile")
    this._profile = mapboxProfile;
  }

  constructor() {
    // for development purpose, to work with local properties on debugging
    eval("window.myService=this;")
  }

  ngOnInit() {
    // Init the mapbox
    // We load both js & css and insert them to the head index
    // import <js_module> way didn't work
    // load css file here instead of on index.html, this way is possible to create object oriented in the future
    let mapboxJs = "https://api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.js";
    let mapboxCss = "https://api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css";
    let threeJs = "https://unpkg.com/three@0.106.2/build/three.min.js";
    let threeboxJs = "assets/threebox.js";
    let gltfJs = "https://unpkg.com/three@0.106.2/examples/js/loaders/GLTFLoader.js";
    this.loadScript(mapboxJs, ()=>{
      this.loadCSS(mapboxCss, ()=>{
        this.loadScript(threeJs, ()=>{
          this.loadScript(threeboxJs, ()=>{
            this.loadScript(gltfJs, ()=>{
              this.loader = new THREE.GLTFLoader();
              this.isLocationEnabled();
            })
          })
        })
      })
    })
  }

  /** Load a mapbox js api file
  \param url the source of the js file
  \param onLoadFn The function to run once the file has loaded.
  */
  loadScript(url, onLoadFn) {
    let jsScript = document.createElement('script');
    jsScript.onload = onLoadFn;
    jsScript.src = url;
    document.head.appendChild(jsScript);
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

  /**
   * Overload this method once the libraries loaded
   */
  isLocationEnabled() { }
  
  /**
   * Get the current coordinate of the device
   * Using navigator instead of ionic geolocation on ionic apps, to work with geoLocationOptions
   */
  async getDeviceLocation() {
    this.devicePos = null; // always start with null
    await new Promise((resolve, reject)=>{
      navigator.geolocation.getCurrentPosition(
        (data) => {
          this.devicePos = [data.coords.longitude, data.coords.latitude];
          return resolve()
        }, (error) => {
          console.log('Error getting location', error);
          return reject()
        }, { maximumAge:0, enableHighAccuracy: true }
      )
    })
    console.log("Position: ", this.devicePos)
  }

  /**
   * Init the mapbox and starting coordinate, it will init the rendering 3d obj marker too
   * @param element The template element will be injected the mapbox
   */
  initMap(element) {
    // dummy data for singapore region, for development
    // coords = [103.73991432110006, 1.3068622273599857];
    
    // Init the mapbox
    mapboxgl.accessToken = this._profile.accessToken;
    this.map = new mapboxgl.Map({
      container: element,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.devicePos,
      zoom: 15,
      pitch: 60,
      antialias: true
    })

    if (this._profile.type == "driver")
      this.addLayer('../../assets/truck/scene.gltf', null, null);
    else
      this.pullActiveTrips(); // for office
  }

  pullActiveTrips() { }

  /**
   * Add new map layer
   * @param gltfPath The path of 3d gltf file
   * @param coords The obj coordinate position, set null for single device (driver)
   * @param markerId The unique marker ID, set null for single device (driver)
   */
  addLayer(gltfPath, coords, markerId) {
    markerId = (markerId) ? markerId : this._profile.markerId
    coords = (coords) ? coords : this.devicePos
    this.map.on('style.load', ()=>{
      this.map.addLayer({
        id: markerId,
        type: 'custom',
        renderingMode: '3d',
        onAdd: (map, mbxContext)=>{
          this.tb = new Threebox(
            map, 
            mbxContext,
            {defaultLights: true}
          );
          let scene = new THREE.Scene();
          this.loader.load(gltfPath, ((gltf)=>{
            scene.add(gltf.scene);
            this.layerObj[markerId] = this.tb.Object3D({obj: scene, units:'scene' }).setCoords(coords);
            this.tb.add(this.layerObj[markerId]);
          }).bind(this));

					// import truck from an external obj file, scaling up its size 10x
					// var options = {
					// 	obj: '../../assets/tesla/truck.obj',
					// 	mtl: '../../assets/tesla/truck.mtl',
					// 	scale: 10
					// }
					// this.tb.loadObj(options, (model)=>{
					// 	this.layerObj = model.setCoords(this.userPos);
					// 	this.tb.add(this.layerObj);
					// })
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
   * @param destination The destiination coordinate
   * @param origin The origin coordinate, set null for single device (driver)
   * @param markerId The unique id of marker, set null for single device (driver)
   */
  travelPath(destination, origin, markerId) {
    origin = (origin) ? origin : this.devicePos;
    markerId = (markerId) ? markerId : this._profile.markerId;
    // request directions. See https://docs.mapbox.com/api/navigation/#directions for details
    let url = "https://api.mapbox.com/directions/v5/mapbox/driving/"+[origin, destination].join(';')+"?geometries=geojson&access_token=" + mapboxgl.accessToken
    this.fetchFunction(url, (data)=>{
      console.log("Direction: ", data)
      // extract path geometry from callback geojson, and set duration of travel
      this.directionOpt[markerId] = {
        path: data.routes[0].geometry.coordinates,
        duration: data.routes[0].duration * 1000
      }
      // set up geometry for a line to be added to map, lofting it up a bit for *style*
      var lineGeometry = this.directionOpt[markerId].path.map((coordinate)=>{
        return coordinate.concat([15])
      })
      // create and add line object
      this.directionLine[markerId] = this.tb.line({
        geometry: lineGeometry,
        width: 5,
        color: 'steelblue'
      })
      this.tb.add(this.directionLine[markerId]);

      // Fit to the bounds of a LineString
      let bounds = data.routes[0].geometry.coordinates.reduce(function(bounds, coord) {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(data.routes[0].geometry.coordinates[0], data.routes[0].geometry.coordinates[0]));
      this.map.fitBounds(bounds, {
        padding: 20
      })
    })
  }

  /**
   * start the travel animation and remove the line when animation ends
   * @param markerId The unique id of marker, set null for single device (driver)
   */
  startTravel(markerId) {
    this.startDateTravel = new Date().getTime();
    markerId = (markerId) ? markerId : this._profile.markerId;
    this.layerObj[markerId].followPath(
      this.directionOpt[markerId],
      ()=>{
        console.log("Followpath: ", this.directionLine[markerId])
        this.tb.remove(this.directionLine[markerId]);
      }
    )
  }

  fetchFunction(url, cb) {
    fetch(url).then((response)=>{
      if (response.status === 200)
        response.json().then((data)=>{
          cb(data)
        })
    })
  }

  // For development
  getPos() {
    navigator.geolocation.getCurrentPosition(
      (data) => {
        console.log([data.coords.longitude, data.coords.latitude])
      }, (error) => {
        console.log('Error getting location', error);
      }, { maximumAge:0, enableHighAccuracy: true }
    )
  }

  // For development
  getDirection(o, d) {
    var url = "https://api.mapbox.com/directions/v5/mapbox/driving/"+[o, d].join(';')+"?geometries=geojson&access_token=" + this._profile.accessToken
    this.fetchFunction(url, (data)=>{
      console.log("NEW DATA: ", data);
    })
  }

  //   // parameters to ensure the model is georeferenced correctly on the map
  //   var modelOrigin = coords;
  //   var modelAltitude = 0;
  //   var modelRotate = [Math.PI / 2, 0, 0];
  //   var modelScale = 15.41843220338983e-8;
    
  //   // transformation parameters to position, rotate and scale the 3D model onto the map
  //   var modelTransform = {
  //     translateX: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).x,
  //     translateY: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).y,
  //     translateZ: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).z,
  //     rotateX: modelRotate[0],
  //     rotateY: modelRotate[1],
  //     rotateZ: modelRotate[2],
  //     scale: modelScale
  //   };

  //   // configuration of the custom layer for a 3D model per the CustomLayerInterface
  //   var customLayer = {
  //     id: '3d-model',
  //     type: 'custom',
  //     renderingMode: '3d',
  //     onAdd: function(map, gl) {
  //       this.camera = new THREE.Camera();
  //       this.scene = new THREE.Scene();
      
  //       // create two three.js lights to illuminate the model
  //       var directionalLight = new THREE.DirectionalLight(0xffffff);
  //       directionalLight.position.set(0, -70, 100).normalize();
  //       this.scene.add(directionalLight);
      
  //       var directionalLight2 = new THREE.DirectionalLight(0xffffff);
  //       directionalLight2.position.set(0, 70, 100).normalize();
  //       this.scene.add(directionalLight2);
      
  //       // use the three.js GLTF loader to add the 3D model to the three.js scene
  //       var loader = new THREE.GLTFLoader();
  //       loader.load('../../assets/ferrari/scene.gltf', ((gltf)=>{
  //         this.scene.add(gltf.scene);
  //       }).bind(this));
  //       this.mp = map;
      
  //       // use the Mapbox GL JS map canvas for three.js
  //       this.renderer = new THREE.WebGLRenderer({
  //         canvas: map.getCanvas(),
  //         context: gl,
  //         antialias: true
  //       });
      
  //       this.renderer.autoClear = false;
  //     },
  //     render: function(gl, matrix) {
  //       var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX);
  //       var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY);
  //       var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ);
      
  //       var m = new THREE.Matrix4().fromArray(matrix);
  //       var l = new THREE.Matrix4().makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
  //       .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
  //       .multiply(rotationX)
  //       .multiply(rotationY)
  //       .multiply(rotationZ);
      
  //       this.camera.projectionMatrix.elements = matrix;
  //       this.camera.projectionMatrix = m.multiply(l);
  //       this.renderer.state.reset();
  //       this.renderer.render(this.scene, this.camera);
  //       this.mp.triggerRepaint();
  //     }
  //   }
  //   this.map.on('load', ()=>{
  //     // Add starting point to the map
  //     this.map.addLayer(customLayer, 'waterway-label');
  //     this.setMapLayer(coords)
  //   })
  // }

  /**
   * Once the user input the destination
   * It's for development
   * On the production, the destination value will be loaded from API
   */
  // setDestination(destVal) {
  //   if (destVal) {
  //     // dummy of destination
  //     this.end = JSON.parse("[" + destVal + "]");

  //     // Add destination point to the map
  //     var oldEnd = {
  //       type: 'FeatureCollection',
  //       features: [{
  //         type: 'Feature',
  //         properties: {},
  //         geometry: {
  //           type: 'Point',
  //           coordinates: this.end
  //         }
  //       }]
  //     }
  //     if (this.map.getLayer('end')) {
  //       this.map.getSource('end').setData(oldEnd);
  //       this.getRoute(this.end);
  //     } else
  //       this.setMapLayer(this.end, 'end');
  //   }
  // }

  /**
   * Add map layer of the source position
   * @param coords the coordinate position
   * @param id the unique layer id, set value 'start' or 'end', default 'start'
   */
  // setMapLayer(coords, id='start') {
  //   this.map.addLayer({
  //     id: id,
  //     type: 'circle',
  //     source: {
  //       type: 'geojson',
  //       data: {
  //         type: 'FeatureCollection',
  //         features: [{
  //           type: 'Feature',
  //           properties: {},
  //           geometry: {
  //             type: 'Point',
  //             coordinates: coords
  //           }
  //         }]
  //       }
  //     },
  //     paint: {
  //       'circle-radius': 10,
  //       'circle-color': '#3887be'
  //     }
  //   })
  //   // on the starting, must make an initial directions request that
  //   // starts and ends at the same location
  //   this.getRoute(coords);
  // }

  // /**
  //  * create a function to make a directions request
  //  * @param end The coordinate of destination
  //  */
  // getRoute(end) {
  //   // make a directions request using cycling profile
  //   // an arbitrary start will always be the same
  //   // only the end or destination will change
  //   var url = 'https://api.mapbox.com/directions/v5/mapbox/driving-traffic/' + this.start[0] + ',' + this.start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&alternatives=true&geometries=geojson&access_token=' + mapboxgl.accessToken;

  //   // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  //   var req = new XMLHttpRequest();
  //   req.responseType = 'json';
  //   req.open('GET', url, true);
  //   req.onload = ()=>{
  //     console.log(req.response)
  //     var data = req.response.routes[0];
  //     console.log(data)
  //     if (!data) {
  //       this.geometryAlert();
  //       this.map.removeLayer('end');
  //       this.map.removeSource('end');
  //       this.end = null;
  //     } else {
  //       var route = data.geometry.coordinates;
  //       var geojson = {
  //         type: 'Feature',
  //         properties: {},
  //         geometry: {
  //           type: 'LineString',
  //           coordinates: route
  //         }
  //       };
  //       // if the route already exists on the map, reset it using setData
  //       if (this.map.getSource('route')) {
  //         this.map.getSource('route').setData(geojson);
  //       } else { // otherwise, make a new request
  //         this.map.addLayer({
  //           id: 'route',
  //           type: 'line',
  //           source: {
  //             type: 'geojson',
  //             data: {
  //               type: 'Feature',
  //               properties: {},
  //               geometry: {
  //                 type: 'LineString',
  //                 coordinates: geojson
  //               }
  //             }
  //           },
  //           layout: {
  //             'line-join': 'round',
  //             'line-cap': 'round'
  //           },
  //           paint: {
  //             'line-color': '#3887be',
  //             'line-width': 5,
  //             'line-opacity': 0.75
  //           }
  //         })
  //       }
  //     }
  //     // add turn instructions here at the end
  //   }
  //   req.send();
  // }

  // /**
  //  * When device moving, reload the current position every 3 seconds
  //  */
  // move() {
  //   setTimeout(()=>{
  //     this.getDeviceLocation().then(data=>{
  //         // For dummy uncomment this line
  //       // data = [104.0503887936485, 1.1147066848611047];
  //       let updateData = {
  //         type: 'FeatureCollection',
  //         features: [{
  //           type: 'Feature',
  //           properties: {},
  //           geometry: {
  //             type: 'Point',
  //             coordinates: data
  //           }
  //         }]
  //       }
  //       // Do move once the 'start' layer available and the update coordinate different to starting point
  //       if (this.map.getLayer('start') && this.start != data) {
  //         this.map.getSource('start').setData(updateData); // Update the coordinate of start layer
  //         this.map.panTo(data); // Update the map center to the current position
  //         this.start = data; // Update start coordinate
  //         this.getRoute(this.end); // Update the route data
  //         this.move(); // Loop this method
  //       }
  //     })
  //   }, 5000)
  // }

  // async geometryAlert() {
  //   const alert = await this.alertCtrl.create({
  //     header: 'Geometry not found',
  //     message: 'Undefined geometry on the destination route, please set the other destination coordinates!',
  //     buttons: [
  //       {
  //         text: 'Ok',
  //         handler: () => {
  //           console.log('ok')
  //         }
  //       }
  //     ]
  //   })

  //   await alert.present();
  // }
}
