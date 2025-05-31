// may have to request increased quotas, or register a watch with Gmail API or receive a webhook when new message arrives


/*
* Using getAccessToken method from tokenManager.js to keep confidential information secure
* */
import {getAccessToken} from "./tokenManager.js";
// import {TBD} from "./malwareAnalysis.js";

chrome.runtime.onInstalled.addListener(async () => {
    console.log("Service worker installed");
    await analyzeEmails();
});

let firstRun = true;
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
    await parseEmails(token, data);
    if (!firstRun) {
        const emails = await parseEmails(token, data);
    } else {
        // create listener, scan new, incoming emails
    }
}

async function parseEmails(token, data) {
    const { messages } = data;
    if (!messages) {
        console.warn("No messages found.");
        return {};
    }

    const SECTION_SIZE = 20;
    const MAX_RETRIES = 5;
    const emails = [];

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    let lastRequestTime = 0;
    const globalDelay = 200;

    async function globalRateLimiter() {
        const now = Date.now();
        const waitTime = Math.max(0, globalDelay - (now - lastRequestTime));
        if (waitTime > 0) {
            await delay(waitTime);
        }
        lastRequestTime = Date.now();
    }

    async function sendSectionWithRetry(section, attempt = 1) {
        let queryBody = "";

        section.forEach((msg, index) => {
            queryBody += `--batch_boundary\r\n`;
            queryBody += `Content-Type: application/http\r\n`;
            queryBody += `Content-ID: <${index + 1}>\r\n\r\n`;
            queryBody += `GET /gmail/v1/users/me/messages/${msg.id}\r\n\r\n`;
        });
        queryBody += `--batch_boundary--`;

        await globalRateLimiter();
        const response = await fetch("https://www.googleapis.com/batch/gmail/v1", {
            headers: {
                "Content-Type": "multipart/mixed; boundary=batch_boundary",
                Authorization: `Bearer ${token}`,
            },
            method: "POST",
            body: queryBody,
        });

        const raw = await response.text();

        if (response.status === 429 || raw.includes("User-rate limit exceeded")) {
            if (attempt <= MAX_RETRIES) {
                const retryAfter = response.headers.get("Retry-After");
                console.log(retryAfter);
                const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
                console.warn(`429 received. Retrying in ${backoffTime / 1000}s`);
                await delay(backoffTime);
                return sendSectionWithRetry(section, attempt + 1);
            } else {
                console.error("Max retries exceeded for this section. Skipping.");
                return [];
            }
        }

        const splitData = raw.split("--batch_").filter(p => p.includes("{"));
        const parsedSection = [];

        splitData.forEach(part => {
            const jsonStart = part.indexOf("{");
            const jsonEnd = part.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                const jsonStr = part.substring(jsonStart, jsonEnd + 1);
                try {
                    const json = JSON.parse(jsonStr);
                    parsedSection.push(json);
                } catch (err) {
                    console.error("Failed to parse JSON from part:\n", jsonStr);
                    console.error(err);
                }
            } else {
                console.warn("Skipping invalid JSON part:\n", part);
            }
        });
        return parsedSection;
    }
    for (let i = 0; i < messages.length; i += SECTION_SIZE) {
        const section = messages.slice(i, i + SECTION_SIZE);
        const sectionResults = await sendSectionWithRetry(section);
        sectionResults.forEach((section) => {
            emails.push(section);
        })
        console.log(`Processed ${Math.min(i + SECTION_SIZE, messages.length)} of ${messages.length} emails.`);
        await delay(1000);
    }

    const parsed = [];
    emails.forEach((email) => {
        if (!email || !email.id || !email.payload) {
            console.warn("Skipping malformed or missing payload email:", email);
            return;
        }
        const emailObject = {
            id: email.id,
            from: null,
            parts: []
        };
        const headers = email.payload.headers || [];
        headers.forEach((header) => {
            if (header.name === "From") {
                emailObject.from = header.value;
            }
        });
        if (email.payload.parts) {
            email.payload.parts.forEach((part) => {
                if (part?.body?.data) {
                    emailObject.parts.push({
                        partId: part.partId,
                        data: atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                    });
                }
            });
        } else if (email.payload.body?.data) {
            emailObject.parts.push({
                partId: email.payload.partId || "0",
                data: atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
            });
        }
        parsed.push(emailObject);
    });


    console.log("Parsed Emails:", parsed);
    return parsed;
}
