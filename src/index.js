import express from 'express';
import cors from 'cors';
import ministeriosRouter from './routes/ministerios.js';

const app = express();
app.use(cors());
app.use(express.json());

// Montar /api
app.use('/api', ministeriosRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
