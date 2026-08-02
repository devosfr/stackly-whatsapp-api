import express from 'express';
// import { createClient } from '@supabase/supabase-js';

import { getWhatsapp, isWhatsappConnected, getQRCode, getWhatsappStatus, connectWhatsapp, logoutWhatsapp } from "./services/whatsapp.js";
import QRCode from "qrcode";

const router = express.Router();

// const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_KEY || "");

// const keys = {

//     get: async (companyId: string, type: any, ids: any) => {

//         const result: any = {};

//         for (const id of ids) {

//             const { data } = await supabase
//                 .from("whatsapp_keys")
//                 .select("value")
//                 .eq("company_id", companyId)
//                 .eq("category", type)
//                 .eq("key", id)
//                 .single();

//             result[id] = data?.value;
//         }

//         return result;
//     },

//     set: async (companyId: string, data: Record<string, Record<string, any>>) => {

//         for (const category in data) {

//             for (const key in data[category]) {

//                 await supabase
//                     .from("whatsapp_keys")
//                     .upsert({

//                         company_id: companyId,

//                         category,

//                         key,

//                         value: data[category][key]

//                     });
//             }
//         }
//     }

// };

// async function loadCreds(companyId: string) {

//     const { data } = await supabase
//         .from("whatsapp_auth")
//         .select("creds")
//         .eq("company_id", companyId)
//         .single();

//     if (!data) {

//         return initAuthCreds();
//     }

//     return data.creds;
// }

// async function saveCreds(
//     companyId: string,
//     creds: any
// ) {

//     await supabase
//         .from("whatsapp_auth")
//         .upsert({
//             company_id: companyId,
//             creds
//         });
// }



// mark
router.get("/whatsapp/connected/:companyId", async (req, res) => {
  const { companyId } = req.params;
await connectWhatsapp(companyId);
  return res.json({
    connected: isWhatsappConnected()
  });
})

router.post("/whatsapp/send-message", async (req, res) => {
  try {
    const { phone, text } = req.body;

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
