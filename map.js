import { myUserId, myUserName, writeUserData, updateUserData, updateUserCounter } from './database.js';

const popupOptions = { closeOnClick: false, autoClose: false, autoPan: false, maxWidth: 150, maxHeight: 300 };

// Function which finds and returns marker by id
// Use like this: map.getMarkerById(1234);
L.Map.include({
    getMarkerById: function (id) {
        let marker = null;
        this.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                if (layer.options.id === id) {
                    marker = layer;
                }
            }
        });
        return marker;
    }
});

// Icon blue
let iconBlue = L.icon({
    iconUrl: 'images/circle-blue.svg',
    // shadowUrl: 'leaf-shadow.png',
    iconSize: [25, 25], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-0, -15] // point from which the popup should open relative to the iconAnchor
});

// Icon red
let iconRed = L.icon({
    iconUrl: 'images/circle-red.svg',
    // shadowUrl: 'leaf-shadow.png',
    iconSize: [25, 25], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-0, -15] // point from which the popup should open relative to the iconAnchor
});

// Map initialization 
export let map = L.map('map', { zoomControl: false, attributionControl: false }).setView([46.8182, 8.2275], 3);
// let map = L.map('map', { attributionControl: false }).setView([0, 0], 2);

// OSM layer
let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
osm.addTo(map);

// Attribution control
let attributionControl = L.control.attribution({
    // position: 'topright'
    position: 'bottomright'
}).addTo(map);

map.attributionControl.setPrefix('<a href="https://www.aronsommer.com/">AS</a> | <a href="https://leafletjs.com/">Leaflet</a>');

// Zoom in button
L.DomEvent.on(L.DomUtil.get('buttonZoomIn'), 'click', function () {
    map.setZoom(map.getZoom() + 1);
});

// Zoom out button
L.DomEvent.on(L.DomUtil.get('buttonZoomOut'), 'click', function () {
    map.setZoom(map.getZoom() - 1);
});

// Add extras to map
import { addExtrasToMap } from './map-extras.js';
addExtrasToMap();

// Create feature group with my marker and circle
// The feature group will be added to map when updatePosition runs the first time
let myMarker, myCircle;
myMarker = L.marker([0, 0], { id: myUserId, icon: iconBlue });
myCircle = L.circle([0, 0], { radius: 0 });
let featureGroup = L.featureGroup([myMarker, myCircle]);
var myLat = 0;
var myLong = 0;
var intervalFunction;

// Check if my marker already exists
// if yes remove it from the map to avoid duplicate
export function checkIfMyMarkerAlreadyExists() {
    if (map.getMarkerById(myUserId)) {
        console.log("Your marker does already exist. Will remove it.");
        map.removeLayer(map.getMarkerById(myUserId));
        updateUserCounter(-1);
    }
}

// This function gets called in database.js after signed in with Firebase anonymously
export function startUpdatingMyPosition() {
    // Check if navigator.geolocation is available
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
    } else {
        // Execute the updatePosition function without delay the first time
        navigator.geolocation.getCurrentPosition(updatePosition, showError);
        // Execute the updatePosition function every 5 seconds
        intervalFunction = setInterval(() => {
            navigator.geolocation.getCurrentPosition(updatePosition, showError);
        }, 5000);
    }
}

// Show error if navigator.geolocation.getCurrentPosition fails
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            // Stop executing the updatePosition function
            clearInterval(intervalFunction);
            console.log("User denied the request for Geolocation.");
            window.alert("You have disabled location tracking.\nPlease enable location tracking than refresh this page.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
}

// Update position of my marker
let updatePositionFirstTime = true;
function updatePosition(position) {

    // console.log(position)
    
    let lat;
    let long;
    let accuracy;

    // Get exact position
    lat = position.coords.latitude;
    long = position.coords.longitude;
    accuracy = position.coords.accuracy;

    // Add offset if accuracyLevel = 0
    if (accuracyLevel == 0) {
        // let offset = ((Math.random() > 0.5 ? 0.001 : -0.009) + Math.random() * 0.008);
        let offset = ((Math.random() > 0.5 ? 0.0001 : -0.0009) + Math.random() * 0.0008);
        lat = lat + offset;
        long = long + offset;
    }

    // Update position of myMarker and myCircle
    myMarker.setLatLng([lat, long]);
    myCircle.setLatLng([lat, long]);
    myCircle.setRadius(accuracy);

    myLat = lat;
    myLong = long;

    if (updatePositionFirstTime) {
        // Write my user data and add my marker and circle to map with correct coordinates
        writeUserData(myUserId, lat, long);
        featureGroup.addTo(map);
        // myMarker.bindPopup("This is you" + "<br>" + myUserId.substring(0, 7), popupOptions).openPopup();
        myMarker.bindPopup("This is you" + "<br>" + myUserName, popupOptions).openPopup();
        // Only go to your position the first time
        // map.fitBounds(featureGroup.getBounds());
        map.setView([myLat, myLong], 3);
    }
    updatePositionFirstTime = false;

    console.log("Your coordinates are\nLat: " + lat + " Long: " + long + " Accuracy: " + accuracy);
    // Update user data in database.js
    updateUserData(lat, long);
}

// Add new user marker
export function addNewUserMarker(userId, lat, long, txt = "", userName) {
    // Marker with id to find later
    let marker = new L.Marker([lat, long], { id: userId, icon: iconRed });
    // marker.customID = userId;
    // marker.on('click', onMarkerClick);
    marker.addTo(map);
    // marker.bindPopup(userId.substring(0, 7) + "<br>" + txt, popupOptions).openPopup();
    marker.bindPopup(userName + "<br>" + txt, popupOptions).openPopup();
}

// Marker on click function
function onMarkerClick(e) {
    alert(e.target.customID);
}

// Update user marker
export function updateMarker(userId, lat, long) {
    console.log("User with userID " + userId + " has new coordinates" + "\nLat: " + lat + " Long: " + long);
    let marker = map.getMarkerById(userId);
    marker.setLatLng([lat, long]);
}

// Update marker text
export function updateMarkerText(userId, txt = "", userName) {
    // Update my text
    if (userId == myUserId) {
        // Update text only if new text is different than the text in popup
        let popupContent = myMarker._popup.getContent();
        let popupContentWithoutUserId = popupContent.replace("This is you<br>" + myUserName.toString(), "");
        popupContentWithoutUserId = popupContentWithoutUserId.replace("<br>", ""); // In case there is another <br>
        // console.log(txt + " / " + popupContentWithoutUserId);
        if (txt != popupContentWithoutUserId) {
            if (myMarker.isPopupOpen()) {
                // myMarker._popup.setContent("This is you" + "<br>" + myUserId.substring(0, 7) + "<br>" + txt, popupOptions).openPopup();
                myMarker._popup.setContent("This is you" + "<br>" + myUserName + "<br>" + txt, popupOptions).openPopup();
            }
            if (!myMarker.isPopupOpen()) {
                // myMarker.bindPopup("This is you" + "<br>" + myUserId.substring(0, 7) + "<br>" + txt, popupOptions).openPopup();
                myMarker.bindPopup("This is you" + "<br>" + myUserName + "<br>" + txt, popupOptions).openPopup();
            }
        }
    }
    // Update text of user marker
    if (userId != myUserId) {
        let marker = map.getMarkerById(userId);
        // Update text only if new text is different than the text in popup
        let popupContent = marker._popup.getContent();
        // let popupContentWithoutUserId = popupContent.replace(userId.substring(0, 7) + "<br>".toString(), "");
        let popupContentWithoutUserId = popupContent.replace(userName + "<br>".toString(), "");
        if (txt != popupContentWithoutUserId) {
            console.log("User with userID " + userId + " has new text\n" + txt);
            if (marker.isPopupOpen()) {
                // marker._popup.setContent(userId.substring(0, 7) + "<br>" + txt, popupOptions).openPopup();
                marker._popup.setContent(userName + "<br>" + txt, popupOptions).openPopup();
            }
            if (!marker.isPopupOpen()) {
                // marker.bindPopup(userId.substring(0, 7) + "<br>" + txt, popupOptions).openPopup();
                marker.bindPopup(userName + "<br>" + txt, popupOptions).openPopup();
            }
        }
    }
}

// Remove user marker
export function removeMarker(userId) {
    // map.getMarkerById(userId);
    map.removeLayer(map.getMarkerById(userId));
}

// Find all markers than fit view to show all markers
export function zoomToFitAllMarkers() {
    let markerBounds = L.latLngBounds([]);
    let allMarkers = [];
    allMarkers = getFeaturesInView();
    if (allMarkers.length && allMarkers.length > 0) {
        console.log("Found this markers: " + allMarkers);
        allMarkers.forEach(marker => {
            markerBounds.extend([marker.lat, marker.lng]);
        });
        // If I am the only user zoom to my marker
        if (allMarkers.length == 1){
        zoomToMyMarker()
        }
        if (allMarkers.length > 1){
        map.fitBounds(markerBounds.pad(0.5));
        }        
    }
    if (allMarkers.length === 0) { console.log("Found no markers!"); }
}

// Search for all markers
function getFeaturesInView() {
    var features = [];
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            // if (map.getBounds().contains(layer.getLatLng())) {
            // features.push(layer.feature);
            features.push(layer.getLatLng());
            // }
        }
    });
    return features;
}

// Zoom to my marker
export function zoomToMyMarker() {
    if (myLat != 0 && myLong != 0) {
        // map.fitBounds(featureGroup.getBounds());
        map.setView([myLat, myLong], 6);
    }
    if (myLat == 0 && myLong == 0) {
        console.log("Your Lat and Long is 0");
    }
}

// Change accuracy
let accuracyLevel = 0;
export function changeAccuracy() {
    if (accuracyLevel == 0) {
        accuracyLevel = 1;
        document.getElementById("buttonChangeAccuracy").textContent = "Accuracy High";
        console.log("accuracyLevel = 1");
    }
    else if (accuracyLevel == 1) {
        accuracyLevel = 0;
        document.getElementById("buttonChangeAccuracy").textContent = "Accuracy Low";
        console.log("accuracyLevel = 0");
    }
}