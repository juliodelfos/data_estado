import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// RUTA DE PRUEBA
app.get("/api/hello", (req, res) => {
  return res.json({ message: "Hello from /api/hello" });
});

export default app;
