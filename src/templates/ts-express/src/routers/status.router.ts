import express from 'express';
import os from 'os';
import pjson from 'pjson';
import process from 'process';

const router = express.Router();

router.get('/', (req: any, res: any) => {
    res.send({
        ok: true,
        app_name: pjson.name,
        hostname: os.hostname(),
        uptime: process.uptime(),
    });
});

export default router;
