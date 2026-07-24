require('dotenv').config();
import express from 'express';
import cors from "cors";
import routesController from './routes';
import { connectWhatsapp } from "./services/whatsapp";
const api = express();


async function bootstrap() {
  await connectWhatsapp();
}

bootstrap();
api.use(cors({
    origin: [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://parcel-partner-sys.vercel.app"
    ],
    credentials: true
}));

api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

api.use(routesController);

const PORT = 4000;

api.listen(PORT, () => {
  console.log(`🚀 Rodando local em http://localhost:${PORT}`);
});


// export default handler;
