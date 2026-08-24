import express from 'express';
import { getWhatsapp, isWhatsappConnected, getQRCode, getWhatsappStatus, connectWhatsapp, logoutWhatsapp } from "./services/whatsapp.js";
import QRCode from "qrcode";

const router = express.Router();

router.get("/whatsapp/connected/:companyId", async (req, res) => {
  const { companyId } = req.params;
  await connectWhatsapp(companyId);
  return res.json({
    connected: isWhatsappConnected()
  });
})

router.post("/whatsapp/send-message", async (req, res) => {
  try {
    const { phone, text, photoMessageUrl } = req.body;
    const sock = getWhatsapp();

    const exists = await sock.onWhatsApp(`${phone}@s.whatsapp.net`);

    console.log(JSON.stringify(exists, null, 2));

    if (!exists?.length) {
      return res.status(404).json({
        success: false,
        message: "Contato nao encontrado"
      })
    }
    const jid = exists[0].jid;

    if (photoMessageUrl) {
      await sock.sendMessage(jid, {
        image: {
          url: photoMessageUrl
        },
        caption: text
      });
    } else {
      await sock.sendMessage(jid, {
        text,
      });
    }


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
  const { companyId } = req.body;
  try {
    const result = await logoutWhatsapp(companyId);
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
