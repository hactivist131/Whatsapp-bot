const express = require("express")
const app = express()

const { 
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")

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

sock.ev.on("messages.upsert", async ({ messages }) => {

for (const msg of messages) {

if (!msg.message) continue

const jid = msg.key.remoteJid

// STATUS AUTO VIEW
if (jid === "status@broadcast") {

await sock.readMessages([msg.key])

await sock.sendMessage(jid, {
react: {
text: "❤️",
key: msg.key
}
})

continue
}

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text

if (!text) continue

await sock.sendPresenceUpdate("composing", jid)

const command = text.toLowerCase()

if (command === "ping") {

await sock.sendMessage(jid, {
text: "Pong 🏓 Bot working"
})

}

if (command === "menu") {

const menu = `
╔═══『 WHATSAPP BOT 』
║
║  ping
║  menu
║
║ Features
║ ✔ Auto React
║ ✔ Auto Typing
║ ✔ Auto View Status
║ ✔ Status React
║
╚══════════════
`

await sock.sendMessage(jid, { text: menu })

}

// AUTO REACT
await sock.sendMessage(jid, {
react: {
text: "🔥",
key: msg.key
}
})

}

})

sock.ev.on("connection.update", (update) => {

const { connection, lastDisconnect } = update

if (connection === "close") {

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !==
DisconnectReason.loggedOut

if (shouldReconnect) {
startBot()
}

}

if (connection === "open") {
console.log("WhatsApp Bot Connected ✅")
}

})

}

startBot()
