import express from "express";
import cors from "cors";
import ministeriosRouter from "./routes/ministerios.js";
import "dotenv/config"; 

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api", ministeriosRouter);

// Exportar como handler para Vercel
export default app;
