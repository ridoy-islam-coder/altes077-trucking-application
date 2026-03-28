import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import globalErrorHandler from './app/middleware/globalErrorhandler';
import notFound from './app/middleware/notfound';
import router from './app/routes';
import config from './app/config';


const app: Application = express();
app.use(express.static('public'));
// app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// body parser (✅ ONLY ONCE)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//parsers
// app.use(express.json());// 🔥 MUST
app.use(cookieParser());
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//     methods: ['GET', 'POST', 'DELETE', 'PATCH'],
//   }),
// );

app.use(cors({
  origin: [config.frontend_url as string, config.backend_url as string], // React dev URLs
  credentials: true,
}));
// application routes
app.use('/api/v1', router);
app.get('/', (req: Request, res: Response) => {
  res.send('server is running successfully');
});
app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;
