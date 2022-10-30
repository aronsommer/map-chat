import { addNewUserMarker, updateMarker, removeMarker, updateMarkerText, startUpdatingMyPosition, checkIfMyMarkerAlreadyExists } from './map.js';
import { generateUserName } from './generate-user-name.js';

// Firebase Realtime Database
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, update, onChildAdded, onChildChanged, onChildRemoved, remove, serverTimestamp, child, get } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyByzik7SIVDNQ4xFTG6E_VHDMx8zc_ogF0",
    authDomain: "map-chat-bf0bf.firebaseapp.com",
    databaseURL: "https://map-chat-bf0bf-default-rtdb.firebaseio.com",
    projectId: "map-chat-bf0bf",
    storageBucket: "map-chat-bf0bf.appspot.com",
    messagingSenderId: "603153590797",
    appId: "1:603153590797:web:3504133ea7dc1300640344",
    measurementId: "G-2DPC9RE34E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics();
const auth = getAuth();
const db = getDatabase();

export let myUserId;
// export const myUserId = generateID();
export let myUserName;
// export const myUserName = generateUserName();
export let createdMyUserEntry = false;

// This function gets called in index.html when user has read the start info
export function startAuthentication() {
    // Authenticate with Firebase anonymously
    signInAnonymously(auth)
        .then(() => {
            // Signed in..
            console.log("Signed in with Firebase anonymously");
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("Could not sign in with Firebase anonymously");
        });

    // If the signInAnonymously method completes without error,
    // the observer registered in the onAuthStateChanged will trigger
    // and you can get the anonymous user's account data from the User object
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User        
            const uid = user.uid;
            console.log("User is signed in and has ui " + user.uid);
            myUserId = user.uid; console.log("myUserId = " + myUserId);

            // Check once if my user entry already exists
            const dbRef = ref(getDatabase());
            get(child(dbRef, `users/${myUserId}`)).then((snapshot) => {
                // If my user entry already exists use same username
                if (snapshot.exists()) {
                    // console.log(snapshot.val());
                    console.log("My user entry already exists with username: " + snapshot.val().username);
                    myUserName = snapshot.val().username;
                    // Following functions get called in map.js
                    checkIfMyMarkerAlreadyExists();
                    startUpdatingMyPosition();
                }
                // If my user entry does NOT exist generate new username
                else {
                    console.log("My user entry does NOT already exist");
                    myUserName = generateUserName();
                    // Following function gets called in map.js
                    startUpdatingMyPosition();
                }
            }).catch((error) => {
                console.error(error);
            });
        } else {
            // User is signed out
            console.log("User is signed out");
        }
    });
}

// Function to update user counter
let userCounter = 0;
export function updateUserCounter(number) {
    userCounter += number;
    // document.getElementById("buttonZoomToMarkers").innerHTML = "Show All Users (" + userCounter + ")";
    // innerHTML has not worked on iOS so we use textContent
    document.getElementById("buttonZoomToMarkers").textContent = "Show All Users (" + userCounter + ")";
    // Animate bg of buttonZoomToMarkers (there has to be a delay between adding/removing classes)
    // document.getElementById('buttonZoomToMarkers').classList.add('bg-animation');
    // setTimeout(() => {
    //     document.getElementById('buttonZoomToMarkers').classList.remove('bg-animation');
    // }, "500");
}

// This function gets called in map.js when updatePositionFirstTime
export function writeUserData(userId, lat, long) {
    set(ref(db, 'users/' + userId), {
        userID: userId,
        lat: lat,
        long: long,
        timestamp: serverTimestamp(),
        username: myUserName
    });
    console.log("Created your user in database with userID\n" + myUserId);
    createdMyUserEntry = true;
    // Increase user counter
    updateUserCounter(1);
}

export function updateUserData(lat, long) {
    update(ref(db, 'users/' + myUserId), {
        userID: myUserId,
        lat: lat,
        long: long,
        timestamp: serverTimestamp(),
        username: myUserName
    });
}

export function writeUserText(txt) {
    // Clean up text
    let cleanedText = txt;
    cleanedText = cleanedText.replaceAll("img", "OMG");
    cleanedText = cleanedText.replaceAll("<", ">");
    update(ref(db, 'users/' + myUserId), {
        text: cleanedText
    });
    updateMarkerText(myUserId, cleanedText, myUserName);
}

const usersRef = ref(db, 'users/');
const userIdRef = ref(db, 'users/' + '/userID');

// If new user added
onChildAdded(usersRef, (data) => {
    if (data.val().userID != myUserId) {
        console.log("New user added with userID " + data.val().userID);
        if (!data.child("text").exists()) {
            addNewUserMarker(data.val().userID, data.val().lat, data.val().long, "", data.val().username);
        }
        if (data.child("text").exists()) {
            addNewUserMarker(data.val().userID, data.val().lat, data.val().long, data.val().text, data.val().username);
        }
        // Increase user counter
        updateUserCounter(1);
    }
    // addCommentElement(postElement, data.key, data.val().text, data.val().author);
});

// If user has new values
onChildChanged(usersRef, (data) => {
    if (data.val().userID != myUserId) {
        // console.log("User with userID: " + data.val().userID + " has new data");
        updateMarker(data.val().userID, data.val().lat, data.val().long);
        // If user has new text
        if (data.child("text").exists()) {
            updateMarkerText(data.val().userID, data.val().text, data.val().username);
        }
        // If user has no more text
        if (!data.child("text").exists()) {
            updateMarkerText(data.val().userID, data.val().text, data.val().username);
        }
    }
});

// If user was removed
onChildRemoved(usersRef, (data) => {
    if (data.val().userID != myUserId) {
        console.log("Removed user with userID " + data.val().userID);
        removeMarker(data.val().userID);
        // Decrement user counter
        updateUserCounter(-1);
    }
});

export function deleteMe() {
    const myUserIdRef = ref(db, 'users/' + myUserId);
    remove(myUserIdRef).then(() => console.log("Deleted me"));
}

// onValue(usersRef, (snapshot) => {
//   const data = snapshot.val();
//   console.log(data);
// });

//console.log(generateID());
function generateID() {
    // Generate timestamp and random number:
    const time = Date.now();
    const randomNumber = Math.floor(Math.random() * 1000000001);
    // Merge both with string underscore (forces string)
    const uniqueId = time + "_" + randomNumber;
    // Make function return the result
    return uniqueId;
}