const express = require("express")
const app = express()

const PORT = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.send("Bot is running 🚀")
})

app.listen(PORT, () => {
  console.log("Server running on port", PORT)
})
const { 
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" })
  })

  // Save login session
  sock.ev.on("creds.update", saveCreds)

  // Handle connection + QR
  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect, qr } = update

    // QR CODE (for linking)
    if (qr) {
      console.log("🔳 Scan this QR code in WhatsApp:")
      console.log(qr)
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected Successfully!")
    }

    if (connection === "close") {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log("♻️ Reconnecting...")
        startBot()
      } else {
        console.log("❌ Logged out. Please delete auth folder and restart.")
      }

    }

  })

}

startBot()
