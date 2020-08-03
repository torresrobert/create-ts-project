import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import statusRouter from './routers/status.router';

dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
app.use('/staus', statusRouter);

const server = app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
export function shutdownServer(): any {
    return server.close();
}

export default app;
