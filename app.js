/**
 * @fileOverview Script that handles Google OAuth2 Authentication
 *
 * @reference Permify https://permify.co/post/oauth-20-implementation-nodejs-expressjs/
 */

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import fs from "fs";
import cors from "cors";

let accessToken = null;

const app = express(); // creating the Express app
app.use(express.json());
app.use(cors()); // add origin later

// loading environment variables from .env
const {
    GOOGLE_OAUTH_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    GOOGLE_OAUTH_SCOPE,
    GOOGLE_ACCESS_TOKEN_URL,
    GOOGLE_TOKEN_INFO_URL,
    PORT
} = process.env

// listens for requests made to root path of server and redirects to Google OAuth2 consent screen
app.get("/", async (req, res) => {
    // creating state token to prevent request forgery
    const state = crypto.randomBytes(32).toString("hex");
    const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${GOOGLE_OAUTH_SCOPE}&prompt=consent`;
    res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);
});

app.get("/oauth2callback", async (req, res) => {
    const { code } = req.query;
    const data = {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
    };
    // exchange authorization code for access token & id_token
    const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(data).toString(),
    });

    if (!response.ok) {
        console.error("Failed to exchange authorization code", await response.text());
        return res.status(500).json({error: "Failed to fetch token"});
    }

    const tokenData = await response.json();
    const {access_token, refresh_token, expires_in} = tokenData;

    // might have to alter this code later
    if (!access_token || !refresh_token) {
        console.error("ID token is missing", tokenData);
        return res.status(400).json({error: "ID token is missing"});
    }

    const tokenObject = {
        access_token,
        refresh_token,
        expires_at: Date.now() + expires_in*1000
    };

    fs.writeFile('tokens.json', JSON.stringify(tokenObject), err => {
        if (err) {
            console.error("Error writing token file", err);
            return res.status(500).json({error: "Failed to save tokens"});
        }
    });

    res.status(200).send("Authentication successful. You may now close this tab.");
});

app.get("/token", async (req, res) => {
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
        if (Date.now() > expires_at) {
            console.log("Access token expired. Refreshing...");
            const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    refresh_token,
                    grant_type: "refresh_token"
                })
            });
            if (!response.ok) {
                console.error("Failed to refresh token", await response.text());
                return res.status(500).json({ error: "Failed to refresh token" });
            }
            const newTokenData = await response.json();
            const newAccessToken = newTokenData.access_token;
            const newExpiresAt = Date.now() + newTokenData.expires_in * 1000;
            const updated = {
                access_token: newAccessToken,
                refresh_token,
                expires_at: newExpiresAt
            };
            fs.writeFile('tokens.json', JSON.stringify(updated), err => {
                if (err) {
                    console.error("Error writing refreshed token", err);
                }
            });
            return res.json({ token: newAccessToken });
        }
        res.json({ token: access_token });
    });
});

// app.get("/token", async (req, res) => {
//     try {
//         const data = await fs.readFile("tokens.json", "utf-8");
//         const { access_token, refresh_token, expires_at } = JSON.parse(data);
//         if (access_token && Date.now() < expires_at) {
//             return res.json({ token: access_token });
//         }
//         const response = await fetch("https://oauth2.googleapis.com/token", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded"
//             },
//             body: new URLSearchParams({
//                 client_id: process.env.GOOGLE_CLIENT_ID,
//                 client_secret: process.env.GOOGLE_CLIENT_SECRET,
//                 refresh_token,
//                 grant_type: "refresh_token"
//             })
//         });
//
//         if (!response.ok) {
//             console.error("Failed to refresh token");
//             return res.status(500).json({ error: "Failed to refresh token" });
//         }
//
//         const newToken = await response.json();
//
//         const updated = {
//             access_token: newToken.access_token,
//             refresh_token,
//             expires_at: Date.now() + newToken.expires_in * 1000
//         };
//
//         await fs.writeFile("tokens.json", JSON.stringify(updated, null, 2), err => {
//             if (err) {
//                 console.log("Error writing refreshed token:", err)
//             }
//         });
//         return res.json({ token: updated.access_token });
//
//     } catch (err) {
//         console.error("Token retrieval failed:", err);
//         res.status(500).json({ error: "Internal error retrieving token" });
//     }
// });


// starts the server on port 8000
app.listen(PORT || 3000, () => {
    console.log(`Server running on port:
    http://localhost:${PORT || 3000}`);
});
