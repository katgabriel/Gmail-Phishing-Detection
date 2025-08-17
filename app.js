import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";

const app = express();

app.use(express.json());
//app.use(express.urlencoded({extended: true}));
app.use(cors()); // add origin later

app.use('/', authRoutes);
app.use('/email', emailRoutes);

export default app;

