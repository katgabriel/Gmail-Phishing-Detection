import app from './app.js';

import * as dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 3000;

// starts the server on port 8000
app.listen(PORT, () => {
    console.log(`Server running on port:
    http://localhost:${PORT}`);
});