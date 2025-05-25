/*
* Using getAccessToken method from tokenManager.js to keep confidential information secure
* */
import {getAccessToken} from "./tokenManager.js";
// import {TBD} from "./malwareAnalysis.js";

chrome.runtime.onInstalled.addListener(async () => {
    console.log("Service worker installed");
    await analyzeEmails();
});

const firstRun = true;
const emails = {};

async function analyzeEmails() {
    const token = await getAccessToken();
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages", {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });
    const data = await res.json();
    console.log(data);
    await parseEmails(data);
    if (!firstRun) {
        // have to go through each email in inbox
    } else {
        // create listener, scan new, incoming emails
    }
}

async function parseEmails(data) {
    const {messages} = data;
    // replace for loop with a map/reduce/forEach
    for (let i = 0; i < messages.length; i++) {
        const {id, threadId} = i;
    }
}


