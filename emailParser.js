/*
* Using getAccessToken method from tokenManager.js to keep confidential information secure
* */
import {getAccessToken} from "./tokenManager.js";

async function parseEmails() {
    const token = await getAccessToken();
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages", {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });
    const data = await res.json();
    console.log(data);
}

// chrome.runtime.onInstalled.addListener(() => {
//     console.log("Service worker installed");
//     parseEmails();
// });

