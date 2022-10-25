'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Cut off time. Users older than this will be deleted.

//const CUT_OFF_TIME = 2 * 60 * 60 * 1000; // 2 Hours in milliseconds.

const CUT_OFF_TIME = 60 * 1000; // 60 seconds in milliseconds.

exports.scheduledDeleteOldUsers = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const ref = admin.database().ref('users/{pushId}').parent;
    const now = Date.now();
    const cutoff = now - CUT_OFF_TIME;
    const oldItemsQuery = ref.orderByChild('timestamp').endAt(cutoff);
    const snapshot = await oldItemsQuery.once('value');
    // create a map with all children that need to be removed
    const updates = {};
    snapshot.forEach(child => {
        updates[child.key] = null;
    });
    // execute all updates in one go and return the result to end the function
    return ref.update(updates);
});