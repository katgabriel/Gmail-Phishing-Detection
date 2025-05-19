import fs from "fs";

let token;

async function checkForToken() {
    try {
        const res = await fetch("http://localhost:8000/token");
        const data = await res.json();
        if (data.token) {
            console.log("Received token:", data.token);
        }
    } catch (e) {
        console.error("Failed to fetch token", e);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TOKEN_UPDATED") {
        console.log("Received new token:", message.token);
        token = message.token;
        queryGmail(token);
    }
})

setInterval(checkForToken, 2000)

//
function queryGmail(token) {
    return 0;
}