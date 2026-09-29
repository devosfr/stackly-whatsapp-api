require('dotenv').config();
import express from 'express';
import cors from "cors";
import routesController from './routes.js';
const api = express();

// api.use(cors({
//     origin: [
//         "http://localhost:*",
//         "http://localhost:8080",
//         "http://localhost:3000",
//         "http://localhost:5173",
//         "https://parcel-partner-sys.vercel.app"
//     ],
//     credentials: true
// }));

api.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://parcel-partner-sys.vercel.app",
      ];

      // requisições sem Origin (ex.: curl, apps nativos) e localhost em dev
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost:")) return callback(null, true);

      callback(null, allowed.includes(origin));
    },
    credentials: true,
  }),
);


api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

api.use(routesController);

const PORT = 4001;

api.listen(PORT, () => {
  console.log(`🚀 Rodando local em http://localhost:${PORT}`);
});

