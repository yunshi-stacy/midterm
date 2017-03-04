// set initial state
mapboxgl.accessToken = 'pk.eyJ1IjoieXVuc2hpIiwiYSI6ImNpeHczcjA3ZDAwMTMyd3Btb3Fzd3hpODIifQ.SWiqUD9o_DkHZuJBPIEHPA';
var map = new mapboxgl.Map({
  'container': 'map',
  'style': 'mapbox://styles/yunshi/cizq7k681000y2sm7fkcoikj6',
  'center': [-75.16523938026528,40.02164677314693],
  'zoom': 10.8
});


var state = {
  "slideNumber": 0,
  'slideTotal': 5,
  'stops': [],
  'stopsFeatures': [],
  'routes': [],
  'part': [1,0,2,4],
  'searchRadius': 0,
  'toggler': {},
  'popup': [],
  'clickPoint': [],
  'nearestPoint': [],
  'connectedLine':[],
  'nearNumber': 0,
  'layerNames': ['routes', 'connectedLine', 'racks', 'bikeshare', 'stops', 'animatePoint', 'clickPoint', 'nearestPoint', 'bufferZone'],
  'msg': {
    "0": "Guess which one is the longest bus route in Philly? <br><br>Click 'next' to continue.",
    "1": 'Rumors say that <strong>THIS</strong> is the longest bus route in Philly.',
    "2": "Move your mouse to each station and get the stop name.<br><br><em>Type a distance to see if there is any bike racks within this distance from each stops.</em>",
    "3": 'Do you find your favorite bike racks location?<br><br><em>Please type a distance again or remain the same to see the Indigo bikeshare stations within that distance.</em>',
    "4": 'Similar, but now we get the Indigo bikeshare stations instead.',
    "5": 'Want to know the average distance of the nearest No.23 bus stops near you? <br>- Write the number of bus stops you wan to include! <br>- Click on the map!'
  }
};



$("#msg").html(state.msg[state.slideNumber]);

$('button#prev').hide();

$('#formRadius').hide();
$('#formNumber').hide();

$.ajax('https://gist.githubusercontent.com/yunshi-stacy/a446c0ddc8ba0c1bfa149dccc19b0eef/raw/c469b2901de514f168f8925517b21b05159c7400/stops23.json')
  .done(function(datum){
    stopsTemp = JSON.parse(datum);
    var stopsArray = [];
    _.each(stopsTemp, function(datum){

      var pt = turf.point([datum.lng,datum.lat], {"name": datum.stopname});
      stopsArray.push(pt);
    });
    state.stops = turf.featureCollection(stopsArray);
  }
);

$.ajax('https://gist.githubusercontent.com/yunshi-stacy/977de53596092a72a6da0cc74afb1feb/raw/135dc9bb016af99d2362bcd4565076e5562a0b2c/route23.geojson')
  .done(function(datum){
    state.routes = JSON.parse(datum);
  }
);
map.on("load",function(){
  //add sources
  _.each(state.layerNames, function(datum){
    map.addSource(datum, {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      }
    });
  });

//add layers
  // data from github
  // bus routes
  map.getSource("routes").setData(state.routes);
  map.addLayer({
    "id": "routes",
    "type": "line",
    "source": "routes",
    "paint": {
      'line-color': "#ff425e",
      'line-width': 1.7,
      'line-opacity': 0.7
    },
    "layout": {
      'visibility': 'none'
    }

  });

  // bus stops
  map.getSource("stops").setData(state.stops);
  map.addLayer({
    "id": "stops",
    "type": "symbol",
    "source": "stops",
    "layout": {
      'icon-image': 'bus-15',
      'visibility': 'none'
    }
  });

  // animate point
  map.addLayer({
    "id": "animatePoint",
    "source": "animatePoint",
    "type": "circle",
    "paint": {
      "circle-color": "#ff425e"
    },
    "layout": {
      'visibility': 'none'
    }
  });


  map.addLayer({
    "id": "bufferZone",
    "type": "fill",
    "source": "bufferZone",
    "paint": {
      "fill-color": "#2190be",
      "fill-opacity": 0.05
    },
    "layout": {
      'visibility': 'none'
    }
  });

  map.addLayer({
    "id": "racks",
    "type": "symbol",
    "source": "racks",
    "layout": {
      'icon-image': 'bicycle-15',
      'visibility': 'none'
    }
  });

  map.addLayer({
    "id": "bikeshare",
    "type": "symbol",
    "source": "bikeshare",
    "layout": {
      'icon-image': 'bicycle-share-15',
      'visibility': 'visible'
    }
  });
});
