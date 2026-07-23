import express from 'express';
import { getWhatsapp, isWhatsappConnected, getQRCode, getWhatsappStatus, connectWhatsapp, logoutWhatsapp } from "./services/whatsapp";
import QRCode from "qrcode";
import fs from 'fs';
import path from 'path';

async function bootstrap() {
  await connectWhatsapp();
}

const router = express.Router();

// mark
router.post("/whatsapp/send-message", async (req, res) => {
  try {
    const { phone, text } = req.body;

    const sock = getWhatsapp();

    const jid = `${phone}@s.whatsapp.net`;

    await sock.sendMessage(jid, {
      text,
    });

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err,
    });
  }
});

router.get("/whatsapp/qr", async (req, res) => {

  if (!isWhatsappConnected()) {
    // Remove auth folder when already connected
    const authPath = path.resolve(__dirname, '../auth');
    if (fs.existsSync(authPath)) {
      try {
        const items = fs.readdirSync(authPath);
        for (const item of items) {
          const itemPath = path.join(authPath, item);
          fs.rmSync(itemPath, { recursive: true, force: true });
        }
        console.log('Auth folder contents removed successfully');
      } catch (error) {
        console.error('Error removing auth folder contents:', error);
      }
    }
    // mark
   await bootstrap();
  } else {
    return res.json({
      connected: true
    });
  }

  const qr = getQRCode();

  if (!qr) {
    return res.json({
      connected: false,
      qr: null
    });
  }
  const image = await QRCode.toDataURL(qr);

  res.json({
    connected: false,
    qr: image
  });
});

// GET /whatsapp/status
router.get("/whatsapp/status", async (req, res) => {
  try {
    const status = getWhatsappStatus();

    const response = {
      status: status,
      connected: status === "connected",
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Error fetching WhatsApp status:', error);
    return res.status(500).json({
      error: `Error fetching WhatsApp status: ${error?.message}`
    });
  }
});

router.post('/whatsapp/logout', async (req: any, res: any) => {
  try {
    const result = await logoutWhatsapp();
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(500).json(result);
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao desconectar WhatsApp.',
      error
    });
  }
});


export default router;
