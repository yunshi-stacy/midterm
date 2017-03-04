//Universal Functions
var clickNextButton = function() {
  if (state.slideNumber === state.slideTotal){
    state.slideNumber = state.slideNumber;
  } else {
    state.slideNumber += 1;
  }
};

var clickPreviousButton = function() {
  if (state.slideNumber === 1){
    state.slideNumber = state.slideNumber;
  } else {
    state.slideNumber -= 1;
    //console.log(state.slideNumber);
  }
};

var eachSlide = function(){
  $("#msg").html();
  $("#msg").html(state.msg[state.slideNumber]);
  switch (state.slideNumber) {
    case 1:
    i=-1;
    j=0;
    $('button').prop("disabled", true);
    state.toggler = window.setInterval(function(){
      animate();
    }, 5);
    $('#formRadius').hide();
    $('#formNumber').hide();
    break;

    case 2:
    showStops();
    $('#formRadius').show();
    $('#formNumber').hide();

    break;
    case 3:
    checkRadius();
    $('#formRadius').show();
    $('#formNumber').hide();

    getRack();
    break;
    case 4:
    $('#formRadius').show();
    $('#formNumber').hide();

    checkRadius();
    getBikeshare();
    break;
    case 5:
    $('#formRadius').hide();
    $('#formNumber').show();
    map.on('click', function(e) {
      state.clickPoint = turf.point([e.lngLat.lng,e.lngLat.lat]);
      findNear();
    });
    break;
    default:
  }
};

var checkRadius = function(){
  state.searchRadius = ((+$('#searchRadius').val() > 0) ? (+$('#searchRadius').val()) : 0.25).toFixed(2);
  $('#searchRadius').val(state.searchRadius);
  if(state.searchRadius > 1.5){
    $('#formRadius').append("<p class='alert'>Alert!!! Tons of bikerack locations are coming! We will use the default 0.25 mile here.</p>");
    $('#searchRadius').val(0.25);
    state.searchRadius = 0.25;
  }
};

// map display
var setVisibility = function(poiArray){
  _.each(
    _.difference(state.layerNames, poiArray), function(datum) {
      if (_.isUndefined(map.getLayer(datum)) === false) {
        map.setLayoutProperty(datum, 'visibility', 'none');
      }
    }
  );
  _.each(poiArray, function(datum){
    if(_.isUndefined(map.getLayer(datum)) === false){
      map.setLayoutProperty(datum, 'visibility', 'visible');
    }
  });

};


//Slide One
var animate = function(){
  setVisibility(['routes','animatePoint']);
  i += 1;
  // returned objects from API call are unordered
  var lineArray = state.routes.features[0].geometry.geometries;
  var segment = turf.along(lineArray[state.part[j]], i * 20,  'meters');
  if (i * 20 <= turf.lineDistance(lineArray[state.part[j]], 'meters')){
    map.getSource('animatePoint').setData(segment);
    map.setCenter([segment.geometry.coordinates[0],segment.geometry.coordinates[1]]);
  } else {
    i = 0;
    j = j + 1;
    if(j === state.part.length) {
      j = state.part.length -1 ;
      window.clearInterval(state.toggler);
      state.popup = new mapboxgl.Popup();
      state.popup.setLngLat([segment.geometry.coordinates[0],segment.geometry.coordinates[1]])
      .setHTML('<h4>Welcome to Bus Route 23!</h4>')
      .addTo(map);
      _.each(['button#next', 'button#prev'], function(datum){
        $(datum).prop("disabled", false);
      });
    }
  }
};

//Slide Two
var showStops = function(){
  state.popup.remove();
  setVisibility(['stops', 'routes']);
  map.setCenter([-75.16523938026528,40.02164677314693]);
  map.setZoom(10.8);
  // Create a popup, but don't add it to the map yet.
  state.popup = new mapboxgl.Popup();
  map.on('mousemove', function(e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['stops'] });
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    if (!features.length) {
      state.popup.remove();
      return;
    }

    var feature = features[0];
    // Populate the popup and set its coordinates
    // based on the feature found.
    state.popup.setLngLat(feature.geometry.coordinates)
    .setHTML(feature.properties.name)
    .addTo(map);
  });
};

// Slide Three
var getRack = function (){
  setVisibility(['racks', 'routes']);
  //show buffer zone
  var buffered = _.map(state.stops.features, function(datum){
    return turf.buffer(datum, state.searchRadius, 'miles');}
  );
  var results = turf.featureCollection(buffered);
  map.getSource('bufferZone').setData(results);
  map.setLayoutProperty('bufferZone', 'visibility', 'visible');

  //connect to carto and get results
  var sql ='SELECT bike_rack.* FROM bike_rack, stops23 WHERE ST_DWithin(bike_rack.the_geom::geography,stops23.the_geom::geography,'+ state.searchRadius * 1609.34 + ')';
  $.ajax('https://yunshi-stacy.carto.com/api/v2/sql?format=GeoJSON&q=' + sql)
  .done(function(datum){
    map.getSource('racks').setData(datum);
  });
};

//Slide Four: similar to the previous one
var getBikeshare = function(){
  state.popup.remove();
  setVisibility(['bikeshare', 'routes']);
  //show buffer zone
  var buffered = _.map(state.stops.features, function(datum){
    return turf.buffer(datum, state.searchRadius, 'miles');}
  );
  var results = turf.featureCollection(buffered);

  map.getSource('bufferZone').setData(results);
  map.setLayoutProperty('bufferZone', 'visibility', 'visible');

  var sql ='SELECT bikeshare_station.* FROM bikeshare_station, stops23 WHERE ST_DWithin(bikeshare_station.the_geom::geography,stops23.the_geom::geography,'+ state.searchRadius * 1609.34 + ')';
  $.ajax('https://yunshi-stacy.carto.com/api/v2/sql?format=GeoJSON&q=' + sql)
  .done(function(datum){
    map.getSource('bikeshare').setData(datum);
  });
};

//Slide Five: Find nearest stops
var findNear = function(){
  setVisibility(['routes', 'stops','connectedLine','clickPoint','nearestPoint']);

  state.nearestPoint = [];
  state.nearNumber = ((+$('#nearNumber').val() > 0) ? (+$('#nearNumber').val()) : 1).toFixed(0);
  if (state.nearNumber > state.stops.features.length) {
    state.nearNumber = state.stops.features.length;
    $('#formNumber').append("<p class='alert'>This number exceeds the total number of the bus stops. We will use the total number " + state.stops.features.length + " here.</p>");
    $('#nearNumber').val(state.nearNumber);
  }

  for (i = 0; i < state.nearNumber; i += 1){
    map.getSource('clickPoint').setData(state.clickPoint);
    nearestPoint = turf.nearest(state.clickPoint, turf.featureCollection(_.difference(state.stops.features, state.nearestPoint)));
    state.nearestPoint.push(nearestPoint);
  }

  map.addLayer({
    "id": "nearestPoint",
    "source": "nearestPoint",
    "type": "circle",
    "paint": {
      "circle-radius": 3,
      "circle-color": "#fbb217"
    }
  });

  map.getSource('nearestPoint').setData(turf.featureCollection(state.nearestPoint));

  var sumDistance = 0;
  state.connectedLine = _.map(state.nearestPoint, function(datum){
    return turf.lineString([turf.coordReduce(datum), turf.coordReduce(state.clickPoint)]);
  });
  _.each(state.connectedLine, function(datum){
    sumDistance += turf.lineDistance(datum, 'miles');
  });
  map.getSource('connectedLine').setData(turf.featureCollection(state.connectedLine));

  map.addLayer({
    "id": "connectedLine",
    "source": "connectedLine",
    "type": 'line',
    "paint": {
      "line-color": "#fbb217",
    }
  });
  map.addLayer({
    "id": "clickPoint",
    "source": "clickPoint",
    "type": "circle",
    "paint": {
      "circle-radius": 7,
      "circle-color": "#fbb217"
    }
  });
  state.popup = new mapboxgl.Popup();
  state.popup.setLngLat(turf.coordReduce(state.clickPoint))
  .setHTML('The average distance of the nearest ' + state.nearNumber + ' bus stops is:<br> ' + (sumDistance/state.nearNumber).toFixed(2) + ' miles.')
  .addTo(map);
};
