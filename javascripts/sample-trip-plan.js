var waypoint_title = '';
var waypoints = [];
var gmapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8ec3b9"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1a3646"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#64779e"
      }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#334e87"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6f9ba5"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3C7680"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#304a7d"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c6675"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#255763"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#b0d5ce"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3a4762"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0e1626"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4e6d70"
      }
    ]
  }
];
var dir_serv, dir_disp;

function get_color_steps(start, end, steps){
  var start_nums = $.map([start.slice(1,3), start.slice(3,5), start.slice(5,7)], function(el, index){
    return parseInt(el, 16);
  });
  var end_nums = $.map([end.slice(1,3), end.slice(3,5), end.slice(5,7)], function(el, index){
    return parseInt(el, 16);
  });
  var step_height = [];
  var output = []

  for (var i = 0; i < 3; i ++){
    step_height.push((end_nums[i] - start_nums[i]) / (steps));
  }
  for (var i = 0; i < steps; i ++){
    output.push('#' + $.map(start_nums, function(el, index){

      return ('000' + (Math.round(el + step_height[index] * i)).toString(16)).slice(-2);
    }).join(''));
  }
  return output;
}


function find_path(wps, mode, rt=true){
  if (wps.length < 2){
    message_log("Too few waypoints selected.", "info");
    return null;
  }
  if (wps.length > 23){
    message_log("Too many waypoints selected. Please keep it under 23 per API limits.", "info");
    return null;
  }

  if (wps.length == 2){
    rt = false;
    message_log("One way direction given.", "info");
  }

  dir_serv.route({
    origin: wps[0].location,
    destination: rt ? wps[0].location : wps[wps.length-1].location,
    travelMode: mode,
    waypoints: rt ? wps.slice(1) : wps.slice(1, -1),
    optimizeWaypoints: true,
  }, function(response, status){
    if (status === 'OK'){
      dir_disp.setDirections(response);
      // style the markers
      var orders = response.routes[0].waypoint_order;
      var colors = get_color_steps('#3CA55C', '#90893a', orders.length + 1);
      $.each([0].concat($.map(orders, function(el, index){
        return el+ 1;
      })), function(index, el){
        var wp_icon = waypoints[index].getIcon();
        wp_icon.fillColor = colors[el];
        wp_icon.fillOpacity = 1;
        waypoints[index].setIcon(wp_icon);
      });
      if (!rt){
        var wp_icon = waypoints[waypoints.length-1].getIcon();
        wp_icon.fillColor = '#90893a';
        wp_icon.fillOpacity = 1;
        waypoints[waypoints.length-1].setIcon(wp_icon);
      }

    } else {
      message_log('Directions request failed due to ' + status, 'warning');
    }
  });

}

function refresh_ids(){
  $('.waypoint').each(function(index, el){
    $(el).find('span:first').html(index + 1);
    $(el).data('wp_marker').setLabel({text: (index + 1).toString(), fontWeight: 'bold'});
  })
}


function add_waypoint(latlng){
  if (!waypoint_title){
    message_log("Awaiting server response.", "info");
    return;
  }
  if ($('.waypoint').length >= 23){
    message_log("Too many waypoints added. Please keep it under 23 per API limits.", "info");
    return;
  }

  var $waypoint = $('<div class="waypoint"><div><span>'
    + ($('.waypoint').length + 1) + '</span>: '
    + waypoint_title
    + '</div><div class="delete_media pull-right"><small><span class="glyphicon glyphicon-trash"></span></small></div><div><span class="label label-default">'
    + latlng.lat().toFixed(5) + ', ' + latlng.lng().toFixed(5)
    + '</span></div></div>');
  $('#output_panel').append($waypoint);
  var waypoint_icon = {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: '#FFFFFF',
    fillOpacity: .8,
    anchor: new google.maps.Point(12, 24),
    scale: 1.5,
    labelOrigin: new google.maps.Point(12, 11),
    strokeColor: '#AAAAAA',
  }
  var waypoint_marker = new google.maps.Marker({
    position:latlng,
    map: map,
    icon: waypoint_icon,
    zIndex: 1,
    label: {
      text: (waypoints.length + 1).toString(),
      fontWeight: 'bold',
    },
  });
  waypoints.push(waypoint_marker);
  $waypoint.data('wp_marker', waypoint_marker);


  $waypoint.hover(function(){
    $(this).find('.delete_media').show();
  }, function(){
    $(this).find('.delete_media').hide();
  });
  $waypoint.find('.delete_media').on('click', function(){
    $waypoint.data('wp_marker').setMap(null);
    waypoints.splice(waypoints.indexOf($waypoint.data('wp_marker')), 1);
    $waypoint.remove();
    refresh_ids();
  });

  //$('.mapboxgl-ctrl-geocoder > input').val('');
  waypoint_title = '';
  $('#searchTextField').val('');
}



function initMap(){
  // initialize map
  map = new google.maps.Map($('#map')[0], {
    center: {lng: 2.3522, lat: 48.8566},
    zoom: 13,
    disableDefaultUI: true,
    scaleControl: true,
    zoomControl: true,
    styles: gmapStyle,
  });
  var geocoder = new google.maps.Geocoder;
  // add the crosshair marker
  var target_icon = {
    path: "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z",
    fillColor: '#FFFFFF',
    fillOpacity: .8,
    strokeWeight: 0,
    anchor: new google.maps.Point(12, 12),
    scale: 1,
  }

  // set up the crosshair marker
  var marker = new google.maps.Marker({
    position:map.getCenter(),
    map: map,
    draggable: true,
    icon: target_icon,
    zIndex: 2,
  });
  var infowindow = new google.maps.InfoWindow();
  google.maps.event.addListener(marker, 'click', function(){
    infowindow.setContent('<button id="waypoint_btn" class="btn btn-primary">Add to Waypoints</button>');
    infowindow.open(map, this);
    $('#waypoint_btn').on('click', function(){
      add_waypoint(marker.getPosition());
      //populate_map(locations);
      infowindow.close();
    });
  });
  google.maps.event.addListener(map, "click", function(){
    infowindow.close();
  })
  marker.addListener('dragend', function(){
    geocoder.geocode({'location': marker.getPosition()}, function(results, status){
      if (status === 'OK'){
        if (results[1]){
          //message_log(results[0].formatted_address);
          $('#searchTextField').val(results[0].formatted_address);
          waypoint_title = results[0].formatted_address;
        } else {
          message_log("No results found.");
        }
      } else {
        message_log("Geocoder failed due to: " + status, 'warning');
      }
    });
  });
  google.maps.event.trigger(marker, 'dragend');

  // search box
  var searchBox = new google.maps.places.SearchBox($('#searchTextField')[0], {});
  searchBox.addListener('places_changed', function(){
    var places = searchBox.getPlaces();
    if (places.length == 0){
      return;
    }
    marker.setPosition(places[0].geometry.location);
    map.setCenter(places[0].geometry.location);
    waypoint_title = places[0].formatted_address;
  });

  //prepare for Directions
  dir_serv = new google.maps.DirectionsService;
  dir_disp = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    polylineOptions: {
      icons: [{
        icon: {
          path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z',
          anchor: new google.maps.Point(12, 12),
          scale: 1,
          fillColor: '#1ee82b',
          fillOpacity: 1,
          strokeColor: '#baffc7',
          strokeWeight: 2,
        },
        repeat: '300px',
      }],
      strokeColor: '#1ee82b',
      strokeOpacity: 0.6,
      strokeWeight: 7,

    },
  });
  dir_disp.setMap(map);

  google.maps.event.addListener(map, 'idle', function(){
    slide_up();
  });
}

$(document).ready(function(){
  $('.selectpicker').selectpicker();
  $('#roundtrip').on('changed.bs.select', function(e, clickedIndex, newValue, oldValue){
    if (clickedIndex == '0'){
      $('.oneway').removeClass('oneway');
    } else {
      $('.waypoint').addClass('oneway');
    }
  });

  $('#calc_btn').on('click', function(){
    var wps = $.map(waypoints, function(el, index){
      return {
        location: el.getPosition(),
        stopover: true,
      }
    });
    if ($('#trans_mode').val() === "TRANSIT" && wps.length > 2){
      message_log("Additional waypoints are not currently supported by the Google API.", 'warning');
      $('#trans_mode').selectpicker('val', 'DRIVING');
    } else {
      find_path(wps, $('#trans_mode').val(), rt = $('#roundtrip').val() == '1');
    }
  });

});
