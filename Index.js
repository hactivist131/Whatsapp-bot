const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason 
} = require("@whiskeysockets/baileys")

const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  // Auto Status View + Auto React
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue

      const from = msg.key.remoteJid
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text

      if (!text) continue

      // Auto typing
      await sock.sendPresenceUpdate("composing", from)

      // Simple auto reply
      if (text.toLowerCase() === "ping") {
        await sock.sendMessage(from, { text: "Pong ✅" })
      }

      // Auto react example
      await sock.sendMessage(from, {
        react: {
          text: "🔥",
          key: msg.key
        }
      })
    }
  })

  // Auto reconnect
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut

      if (shouldReconnect) startBot()
    }
  })
}

startBot()
