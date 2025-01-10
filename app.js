/**
 * @fileOverview Script that handles Google OAuth2 Authentication
 *
 * @author Permify https://permify.co/post/oauth-20-implementation-nodejs-expressjs/
 */

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import fs from "fs";

const app = express(); // creating the Express app
app.use(express.json());

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

// creating state token to prevent request forgery
const state = crypto.randomBytes(16).toString("hex");

// listens for requests made to root path of server and redirects to Google OAuth2 consent screen
app.get("/", async (req, res) => {
    const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${GOOGLE_OAUTH_SCOPE}`;
    res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);
});

app.get("/google/callback", async (req, res) => {
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
        body: JSON.stringify(data),
    });
    const access_token_data = await response.json();

    const { id_token } = access_token_data;

    // verifying and extracting the info in the id token
    const token_info_response = await fetch(
        `${GOOGLE_TOKEN_INFO_URL}?
        id_token=${id_token}`
    );
    res.status(token_info_response.status).json(await token_info_response.json());
    // fs.writeFile('tokens.json', id_token, err => {
    //     if (err) {
    //         console.error(err);
    //     }
    // });
});

// starts the server on port 8000
app.listen(PORT || 3000, () => {
    console.log(`Server running on port:
    http://localhost:${PORT || 3000}`);
});
