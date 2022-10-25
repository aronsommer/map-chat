import { map } from './map.js';

export function addExtrasToMap() {

    // A standalone popup
    var popup = new L.popup({
        closeOnClick: false,
        autoClose: false
    }).setLatLng([52, 8.2275])
        .setContent("Henlo :-)")
        .addTo(map);

    // A marker
    // var marker = L.marker([55.5, -0.09]).addTo(map);
    // marker.bindPopup("I am a popup.").openPopup();
}