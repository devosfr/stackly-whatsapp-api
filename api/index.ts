require('dotenv').config();
import express from 'express';
import cors from "cors";
import bodyParser from "body-parser";
import routesController from './routes';
import { connectWhatsapp } from "./services/whatsapp";
const api = express();


async function bootstrap() {
  await connectWhatsapp();
}

bootstrap();

api.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "https://my-front-application-next.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true }));
api.use(express.json());
api.use(express.json());
api.use(express.text());
api.use(express.urlencoded({ extended: true }));

// Middleware de logging e CORS
api.use((req: any, res: any, next: any) => {
  console.log('Request:', { url: req.url, method: req.method, headers: req.headers });
  // res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Adicionar rota raiz para evitar 404 xxx
api.get("/", (req: any, res: any) => {
  res.json({
    message: "API funcionando! 🚀",
    version: "1.1.0",
    endpoints: [
      "GET /users",
      "GET /users?apartment_id=:id",
      "GET /test",
      "POST /send-email",
      "POST /ollama/generate",
      "POST /sendWhatsappMessage"
    ],
    timestamp: new Date().toISOString()
  });
});


api.get("/test", (req, res) => {
  res.json({ message: "This is a test endpoint xxx" });
});


// routes
api.use(routesController);


// Middleware de fallback para rotas não encontradas
api.use('*', (req: any, res: any) => {
  console.log('Route not found:', { url: req.originalUrl, method: req.method });
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /users',
      'GET /users?apartment_id=:id',
      'GET /test',
      'GET /ollama/status',
      'POST /send-email',
      'POST /ollama/generate',
      'POST /sendWhatsappMessage',
      'POST /logout-whatsapp',
      'POST /users/create',
      'PUT /users/resident/:id',
      'DELETE /users/:id',
      'DELETE /users/:id/photo',
      'POST /image/upload',
      'GET /condominiums',
      'GET /condominiums?companyId=:id',
      'POST /condominiums/create',
      'DELETE /companies/:id',
      'GET /apartments',
      'POST /apartments/create',
      'DELETE /apartments/:id',
      'GET /buildings',
      'POST /buildings/create',
      'DELETE /buildings/:id',
      'DELETE /condominiums/:id',
      'GET /volumes',
      'POST /volumes/create',
      'PUT /volumes/:id/notified'
    ]
  });
});

// Handler específico para Vercel
const handler = (req: any, res: any) => {
  console.log('Handler called:', { method: req.method, url: req.url });

  // Garantir que o middleware de CORS seja aplicado
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled');
    return res.status(200).end();
  }

  // Log das rotas registradas
  console.log('Registered routes:', api._router?.stack?.map((r: any) => ({
    path: r.route?.path,
    methods: r.route?.methods
  })) || 'No routes found');

  try {
    return api(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
};

// const PORT = 4000;

// api.listen(PORT, () => {
//   console.log(`🚀 Rodando local em http://localhost:${PORT}`);
// });


export default handler;
