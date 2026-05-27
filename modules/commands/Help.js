module.exports.config = {
  name: "اوامر",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Ryuzaki Dev",
  description: "قائمة الأوامر بشكل منسق",
  commandCategory: "نظام",
  usages: "[اسم الأمر]",
  cooldowns: 5
};

module.exports.languages = {
  "en": {
    "moduleInfo": "「 %1 」\n%2\n\n❯ الاستخدام: %3\n❯ الفئة: %4\n❯ وقت الانتظار: %5 ثانية\n❯ الصلاحية: %6\n\n» بواسطة %7 «",
    "user": "مستخدم",
    "adminGroup": "أدمن المجموعة",
    "adminBot": "أدمن البوت"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  const command = commands.get((args[0] || "").toLowerCase());

  if (command) {
    return api.sendMessage(
      getText(
        "moduleInfo",
        command.config.name,
        command.config.description || "لا يوجد وصف",
        `${prefix}${command.config.name} ${command.config.usages || ""}`.trim(),
        command.config.commandCategory || "عام",
        command.config.cooldowns || 1,
        (command.config.hasPermssion == 0)
          ? getText("user")
          : (command.config.hasPermssion == 1)
          ? getText("adminGroup")
          : getText("adminBot"),
        command.config.credits || "—"
      ),
      threadID,
      messageID
    );
  }

  const categoryIcons = {
    "الغروب":         "🐉الغروب🐉",
    "نظام":           "🐉الغروب🐉",
    "الذكاء الصناعي": "🐉الذكاء الصناعي🐉",
    "ذكاء صناعي":    "🐉الذكاء الصناعي🐉",
    "الأنمي":         "🐉الأنمي🐉",
    "انمي":           "🐉الأنمي🐉",
    "ترفيه":          "🐉ترفيه🐉",
    "ترفية":          "🐉ترفيه🐉",
    "البحث":          "🐉البحث🐉",
    "بحث":            "🐉البحث🐉",
    "الاقتصاد":       "🐉الاقتصاد🐉",
    "اقتصاد":         "🐉الاقتصاد🐉",
    "الألعاب":        "🐉الألعاب🐉",
    "العاب":          "🐉الألعاب🐉",
    "المطور":         "🐉المطور🐉",
    "مطور":           "🐉المطور🐉",
    "عام":            "🐉عام🐉",
    "صور":            "🐉الصور🐉",
    "النظام":         "🐉الغروب🐉",
  };

  const categories = {};
  let totalCount = 0;

  for (let [name, value] of commands) {
    const cat = value.config.commandCategory || "عام";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(name);
    totalCount++;
  }

  let blocks = "";

  for (let cat in categories) {
    const cmds = categories[cat].sort();
    const icon = categoryIcons[cat] || `🐉${cat}🐉`;
    const border = "────────────╯";

    blocks += `╭── ${icon} ──╮\n`;
    for (const cmd of cmds) {
      blocks += `│➟ ${cmd} ⛩️\n`;
    }
    blocks += `╰${border}\n\n`;
  }

  const msg =
`『⛩️ريوزاكي بوت⛩️』
── قائمة الأوامر ──

${blocks}📌 البوت يحتوي حاليا على ${totalCount} أمر متاح.
💡 للمساعدة: ${prefix}اوامر <اسم_الأمر>`;

  return api.sendMessage(msg, threadID, messageID);
};
