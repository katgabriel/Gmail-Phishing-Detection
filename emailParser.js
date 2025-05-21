// chrome.runtime.onInstalled.addListener(() => {
//     console.log("Service worker activated")
// })

/*
https://developers.google.com/workspace/gmail/api/quickstart/js
--> in case you want to implement an html page
*/

import * as dotenv from "dotenv";
dotenv.config();

const {
    API_KEY,
    GOOGLE_CLIENT_ID,
    GOOGLE_OAUTH_SCOPE,
    DISCOVERY_DOC
} = process.env;

let token = null;
let tokenClient;
let messages;

async function checkForToken() {
    try {
        const res = await fetch("http://localhost:8000/token");
        // const data = await res.json();
        const {token} = await res.json();
        console.log("Token:", token);
        if (token) {
            //token = data.token;
            console.log("Received token:", token);
            const res2 = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const messages = await res2.json();
            if (messages) {
                console.log("Messages received");
            }
            clearInterval(pollingInterval);
        }
    } catch (e) {
        console.error("Failed to fetch token", e);
    }
}

const pollingInterval = setInterval(checkForToken, 2000);


// function gapiLoaded() {
//     gapi.load('client', initializeGapiClient);
// }
//
// async function initializeGapiClient(token) {
//     await gapi.client.init({
//         apiKey: API_KEY,
//         clientId: GOOGLE_CLIENT_ID,
//         discoveryDocs: [DISCOVERY_DOC],
//     }).then(function() {
//         return gapi.client.request({
//             'path': 'https://people.googleapis.com/v1/people/me?requestMask.includeField=person.names',
//         })
//     }).then(function(response) {
//         console.log(response.result);
//     }, function(reason) {
//         console.log("Error: " + reason.result.error.message);
//     });
//
//     function gisLoaded() {
//         tokenClient = google.accounts.oauth2.initTokenClient({
//             client_id: GOOGLE_CLIENT_ID,
//             scope: GOOGLE_OAUTH_SCOPE,
//             callback: '',
//         });
//     }
// }
//
// async function listLabels() {
//     let response;
//     try {
//         response = await gapi.client.gmail.users.labels.list({
//             'userId': me,
//         });
//     } catch (e) {
//         console.log(err.message);
//         return;
//     }
//     const output = labels.reduce(
//         (str, label) => `${str}${label.name}\n`,
//         'Labels:\n');
//     console.log(output);
// }
