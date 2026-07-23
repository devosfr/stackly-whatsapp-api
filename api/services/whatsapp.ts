
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";
import pino from "pino";

let sock: ReturnType<typeof makeWASocket> | null = null;

let currentQR: string | null = null;
let isConnected = false;
let isConnecting = false;

export async function connectWhatsapp() {
  if (isConnecting) {
    console.log("Já existe uma conexão em andamento.");
    return;
  }

  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const { version } = await fetchLatestBaileysVersion();

    console.log("Versão do WhatsApp:", version);

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "debug" }),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      console.log(
        "connection.update:",
        JSON.stringify(update, null, 2)
      );

      const { connection, qr, lastDisconnect } = update;

      if (connection === "connecting") {
        console.log("Conectando...");
      }

      if (qr) {
        console.log("Novo QR recebido.");
        currentQR = qr;
      }

      if (connection === "open") {
        console.log("✅ WhatsApp conectado.");

        isConnected = true;
        isConnecting = false;
        currentQR = null;
      }

      if (connection === "close") {
        console.log("❌ WhatsApp desconectado.");

        isConnected = false;
        isConnecting = false;
        currentQR = null;

        const statusCode =
          (lastDisconnect?.error as Boom)?.output?.statusCode;

        console.log("Código:", statusCode);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("Sessão desconectada. Será necessário ler o QR novamente.");
          return;
        }

        console.log("Reconectando em 3 segundos...");

        setTimeout(() => {
          connectWhatsapp();
        }, 3000);
      }
    });
  } catch (err) {
    isConnecting = false;
    console.error("Erro ao conectar:", err);

    setTimeout(() => {
      connectWhatsapp();
    }, 5000);
  }
}

export function getWhatsapp() {
  if (!sock) {
    throw new Error("WhatsApp não inicializado.");
  }

  return sock;
}

export function getQRCode() {
  return currentQR;
}

export function isWhatsappConnected() {
  return isConnected;
}

export function getWhatsappStatus() {
  if (isConnected) {
    return "connected";
  }

  if (currentQR) {
    return "waiting_qr";
  }

  if (isConnecting) {
    return "connecting";
  }

  return "disconnected";
}

export async function logoutWhatsapp() {
  if (!sock) {
    return { success: true, message: "WhatsApp já está desconectado." };
  }

  try {
    await sock.logout();
    sock = null;
    isConnected = false;
    isConnecting = false;
    currentQR = null;

    return { success: true, message: "WhatsApp desconectado com sucesso." };
  } catch (error) {
    console.error("Erro ao desconectar WhatsApp:", error);
    return { success: false, message: "Erro ao desconectar WhatsApp.", error };
  }
}
