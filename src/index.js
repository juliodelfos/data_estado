import express from "express";
import cors from "cors";
import ministeriosRouter from "./routes/ministerios.js";
import "dotenv/config"; // Carga las variables .env en process.env

const app = express();
app.use(cors());
app.use(express.json());

// Montar /api
app.use("/api", ministeriosRouter);

// Exportar el app para Vercel
export default app;
