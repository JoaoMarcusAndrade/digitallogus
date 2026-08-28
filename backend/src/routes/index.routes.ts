import { Router } from 'express'
import { __filename, _dirname } from '../app.js'
import readerRoutes from './leitor.routes.js'

import path from 'path'

export const router = Router()

/**
 * @swagger
 * /:
 *   get:
 *     summary: Envia arquivo html base
 *     responses:
 *       200:
 *         description: index.html
 */
router.get('/', (req,res) => {
    res.sendFile(path.join(_dirname, "views", "index.html"))
});

router.use('/api/leitor', readerRoutes)
//router.use('/api/livros', bookRoutes)
//router.use('/api/bbtcario', bookRoutes)

