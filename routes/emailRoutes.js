import {Router} from "express";
import axios from "axios";
import fs from "fs";
import MailParser from "mailparser";

import {google} from "googleapis";
const gmail = google.gmail("v1");

import * as dotenv from "dotenv";
dotenv.config();
const {
    PORT,
    GOOGLE_ACCESS_TOKEN_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
} = process.env;

const router = Router();

const generateConfig = (url, accessToken) => {
    return {method: "get",
        url: url,
        headers: {
            Authorization: `Bearer ${accessToken} `,
            "Content-type": "application/json",
        },
    };
};


router.get('/', async (req, res) => {
    const token = "";
    fs.readFile('tokens.json', 'utf-8', async (err, data) => {
        if (err || !data) {
            return res.status(404).json({ error: "No token available yet" });
        }
        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ error: "Corrupt token file" });
        }
        const { access_token, refresh_token, expires_at } = parsed;
        try {
            // only querying for 20 email right now due to batch requests being too large
            const gmailResponse = await axios(
                generateConfig(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20`, access_token)
            );
            const messageIds = gmailResponse.data.messages.map(msg => msg.id);
            const nextPageToken = gmailResponse.data.nextPageToken;
            const emailRequests = messageIds.map(id => axios(
                generateConfig(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=raw`, access_token)
            ));
            const emailResponses = await Promise.all(emailRequests);
            const emailData = {};
            const parser = new MailParser.MailParser();
            for (let i = 0; i < emailResponses.length; i++) {
                const emailObj = {
                    attachments: [],
                    text: {}
                }
                const input = emailResponses[i];
                parser.on('headers', headers => {
                    const headerObj = {};
                    for (const [k, v] of headers) {
                        headerObj[k] = v;
                    } emailObj.headers = headerObj;
                })
                parser.on('data', data => {
                    if (data.type === 'attachment') {
                        emailObj.attachments.push(data);
                        data.content.on('readable', () => data.content.read());
                        data.content.on('end', () => data.release());
                    } else {
                        emailObj.text = data
                    }
                })
                emailData.push(emailObj);
            } console.log(emailData);
        } catch(error) {
            console.error(`Error fetching or parsing email:`, error.message);
            res.status(500).send({error: `Failed to fetch or parse email: ${error.message}`});
        }
    });
});

export default router;
