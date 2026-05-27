module.exports.config = {
    name: "المطور",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Ryuzaki Dev",
    description: "عرض معلومات المطور والبوت",
    commandCategory: "النظام",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;

    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = d > 0
        ? `${d}d ${h}h ${m}m ${s}s`
        : `${h}h ${m}m ${s}s`;

    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groupCount = threads.filter(t => t.isGroup).length;

    const { commands } = global.client;
    const commandCount = commands ? commands.size : 0;

    const message =
`╔══════════════════════════╗
║   👑  د ا ر و ي ن  👑   ║
╚══════════════════════════╝

🌟 الاسم     :  داروين
🤖 البوت     :  Ryuzaki Bot
🛠️ الدور     :  مطوّر ومبرمج
🌍 اللغة     :  JavaScript / Node.js

━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 إحصائيات البوت:
  ┌ 📦 الأوامر    ➤  ${commandCount}
  ├ 👥 المجموعات  ➤  ${groupCount}
  └ ⏱️ وقت التشغيل ➤  ${uptimeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 تواصل مع المطور:
  📘 فيسبوك:
  https://www.facebook.com/profile.php?id=61563738496733

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 "أُطوّر بشغف لأجعل تجربتكم أفضل"

╚══════ Ryuzaki Bot ══════╝`;

    return api.sendMessage(message, threadID, messageID);
};
