import { Router } from 'express';
import { getAllMinisterios } from '../controllers/ministeriosController.js';

const router = Router();

// Ruta para /api/:versionParam -> Ej: /api/v0 -> traer todos los ministerios
router.get('/:versionParam', getAllMinisterios);

export default router;
