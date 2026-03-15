const express = require("express")
const app = express()

const { 
  default: makeWASocket, 
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")

// Render web server
app.get("/", (req, res) => {
  res.send("WhatsApp Bot Running 🚀")
})

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running")
})

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  // AUTO VIEW STATUS
  sock.ev.on("messages.upsert", async ({ messages }) => {

    for (const msg of messages) {

      if (!msg.message) continue

      const jid = msg.key.remoteJid

      // View status automatically
      if (jid === "status@broadcast") {

        await sock.readMessages([msg.key])

        await sock.sendMessage(jid, {
          react: {
            text: "❤️",
            key: msg.key
          }
        })

        return
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text

      if (!text) return

      // Auto typing
      await sock.sendPresenceUpdate("composing", jid)

      const command = text.toLowerCase()

      // Ping command
      if (command === "ping") {
        await sock.sendMessage(jid, { text: "Pong 🏓 Bot is alive" })
      }

      // Menu command
      if (command === "menu") {

        const menu = `
╔═══『 WHATSAPP BOT 』
║
║ 1. ping
║ 2. menu
║
║ Features:
║ ✔ Auto React
║ ✔ Auto Typing
║ ✔ Auto View Status
║ ✔ Status React
║
╚══════════════
`

        await sock.sendMessage(jid, { text: menu })
      }

      // Auto react to every message
      await sock.sendMessage(jid, {
        react: {
          text: "🔥",
          key: msg.key
        }
      })

    }

  })

  //
