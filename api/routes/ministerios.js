import { Router } from 'express';
import { getAllMinisterios, getMinisterioEspecifico } from '../controllers/ministeriosController.js';

const router = Router();

// 1) Ruta para /api/:versionParam -> Trae todos los ministerios en esa versión.
router.get('/:versionParam', getAllMinisterios);

// 2) Ruta para /api/:versionParam/:slugMinisterio -> Trae SOLO un ministerio (por slug).
router.get('/:versionParam/:slugMinisterio', getMinisterioEspecifico);

export default router;
