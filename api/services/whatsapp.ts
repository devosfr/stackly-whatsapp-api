
import { DisconnectReason, makeWASocket, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { useSupabaseAuthState } from "./supabaseAuthState";

import pino from "pino";

let sock: ReturnType<typeof makeWASocket> | null = null;

let currentQR: string | null = null;
let isConnected = false;
let isConnecting = false;

export async function connectWhatsapp(companyId: string) {
  console.log("CONNECT CHAMADO", new Date().toISOString());
  console.log("SOCKET ATUAL", !!sock);
  if (sock) {
    console.log("JÁ EXISTE SOCKET");

  }
  const { version } = await fetchLatestBaileysVersion();

  if (isConnecting) {
    console.log("Já existe uma conexão em andamento.");
    return;
  }

  isConnecting = true;

  const { state, saveCreds } =
    await useSupabaseAuthState(companyId);
  // const { state, saveCreds } = await useMultiFileAuthState("./auth");


  console.log("VERSION", version);


  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({
      level: "silent"
    }),
    browser: [
      "Chrome",
      "Linux",
      "1.0.0"
    ],
    generateHighQualityLinkPreview: false
  });
  // mark

  console.log(
    "AUTH === SOCK AUTH",
    state === sock.authState
  );

  console.log(
    "CREDS === SOCK CREDS",
    state.creds === sock.authState.creds
  );

  console.log(
    "KEYS === SOCK KEYS",
    state.keys === sock.authState.keys
  );

  console.log("SOCKET CRIADO");



  console.log(
    "saveCreds:",
    typeof saveCreds
  );

  console.log(
    "keys.set:",
    typeof state.keys.set
  );

  console.log(
    "keys.get:",
    typeof state.keys.get
  );

  sock.ws.on("close", (...args: any[]) => {
    console.log("WS CLOSE", args);
  });

  sock.ws.on("open", () => {
    console.log("WS OPEN");
  });

  sock.ws.on("error", (err: any) => {
    console.error("WS ERROR", err);
  });

  sock.ev.on("creds.update", async (c: any) => {
    console.log("CREDS EVENT");
    console.dir(c, { depth: 2 });

    await saveCreds(c);
  });

  sock.ev.on("messages.upsert", () => {
    console.log("MESSAGE");

  });

  sock.ev.on("messaging-history.set", () => {
    console.log("HISTORY");

  });


  isConnecting = true;

  sock.ev.on("connection.update", (update: any) => {
    console.log("====================");
    console.log("CONNECTION:", update.connection);
    console.log("IS NEW LOGIN:", update.isNewLogin);
    console.log("USER:", sock?.user);
    console.log("====================");

    console.log("UPDATE");
    console.dir(update, { depth: null });

    if (update.lastDisconnect?.error) {
      console.log("LAST ERROR");
      const err = update.lastDisconnect.error as any;

      console.log("========== STATUS ==========");
      console.log(err.output?.statusCode);

      console.log("========== OUTPUT ==========");
      console.log(JSON.stringify(err.output, null, 2));

      console.log("========== DATA ==========");
      console.log(JSON.stringify(err.data, null, 2));

      console.log("========== ATTRS ==========");
      console.log(JSON.stringify(err.data?.attrs, null, 2));

      console.log("========== TAG ==========");
      console.log(err.data?.tag);

      console.log("========== CONTENT ==========");
      console.log(JSON.stringify(err.data?.content, null, 2));

    }


    console.log("connection =", update.connection);
    console.log("isNewLogin =", update.isNewLogin);
    console.log("receivedPendingNotifications =", update.receivedPendingNotifications);
    const { connection, qr, lastDisconnect } = update;

    console.log("connection:", connection);

    if (qr) {
      console.log("QR RECEBIDO");
      currentQR = qr;
    }

    if (connection === "open") {
      console.log("OPEN");
      currentQR = null;
      isConnected = true;
      isConnecting = false;
    }

    if (connection === "close") {

      const statusCode =
        (lastDisconnect?.error as Boom)?.output?.statusCode;

      console.log("STATUS:", statusCode);


      if (statusCode !== DisconnectReason.loggedOut) {

        console.log("REINICIANDO WHATSAPP...");

        sock = null;
        isConnecting = false;

        setTimeout(() => {
          connectWhatsapp(companyId);
        }, 3000);

      } else {

        console.log("USUÁRIO DESCONECTOU");

        isConnected = false;
        isConnecting = false;
      }
    }
  });

}

export function getWhatsapp() {
  if (!sock) {
    throw new Error("WhatsApp não inicializado.", { cause: "WHATSAPP_NOT_INITIALIZED" });
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

export async function logoutWhatsapp(companyId: string) {
  const { state, resetWhatsappSession } =

    await useSupabaseAuthState(companyId);
  await resetWhatsappSession(companyId || '1');

  if (!sock) {
    return { success: true, message: "WhatsApp já está desconectado." };
  }

  try {
    // mark
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
