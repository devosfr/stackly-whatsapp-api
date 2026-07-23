import express from "express";
import cors from "cors";

const api = express();

api.use(cors());

api.use(express.json());

api.get("/", (req, res) => {
  res.json({ ok: true });
});

api.get("/users", (req, res) => {
  res.json([
    {
      id: 1,
      name: "John Doe"
    }
  ]);
});

api.get("/test", (req, res) => {
  res.json({ message: "This is a test endpoint" });
});


export default api;