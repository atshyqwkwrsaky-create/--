const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "امسح",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Ryuzaki Dev",
  description: "حذف ملفات الأوامر نهائياً من البوت",
  commandCategory: "مطور",
  usages: "امسح",
  usePrefix: false,
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const adminList = global.config.ADMINBOT || [];
  const devID = "61563738496733";

  if (!adminList.includes(String(senderID)) && String(senderID) !== devID) {
    return api.sendMessage(
`╭────────────────╮
  ⎔  رفض الوصول 🚫
╰────────────────╯

 ╰─▫ هذا الأمر للمطور فقط

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`, threadID, messageID);
  }

  const cmdPath = path.join(__dirname);
  const files = fs.readdirSync(cmdPath)
    .filter(f => f.endsWith(".js"))
    .sort();

  if (files.length === 0) {
    return api.sendMessage("لا توجد ملفات أوامر.", threadID, messageID);
  }

  let list = "";
  files.forEach((file, i) => {
    let displayName = file.replace(".js", "");
    let desc = "";
    try {
      const cmd = require(path.join(cmdPath, file));
      if (cmd.config) {
        if (cmd.config.name) displayName = cmd.config.name;
        if (cmd.config.description) desc = ` — ${cmd.config.description}`;
      }
    } catch (e) {}
    list += ` ${i + 1}. ${displayName}${desc}\n`;
  });

  const msg =
`╭────────────────╮
  ⎔  حذف الأوامر 🗑️
╰────────────────╯

 ⊞ ◜ قـائـمـة الأوامـر (${files.length} أمر) ◞

${list}
 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 ├─▫ رد بـرقـم الأمر لحذفه
 ├─▫ لحذف أكثر من ملف: 1 3 5
 ╰─▫ رد بـ 0 للإلغاء

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`;

  return api.sendMessage(msg, threadID, (err, info) => {
    if (err) return;
    global.client.handleReply.push({
      name: "امسح",
      messageID: info.messageID,
      senderID: String(senderID),
      files: files,
      cmdPath: cmdPath
    });
  });
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (String(senderID) !== String(handleReply.senderID)) return;

  const input = (body || "").trim();

  if (input === "0") {
    global.client.handleReply = global.client.handleReply.filter(
      r => r.messageID !== handleReply.messageID
    );
    return api.sendMessage(
`╭────────────────╮
  ⎔  تم الإلغاء ✅
╰────────────────╯

 ╰─▫ لم يتم حذف أي ملف

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`, threadID, messageID);
  }

  const nums = input
    .split(/[\s,،]+/)
    .map(n => parseInt(n))
    .filter(n => !isNaN(n) && n > 0);

  if (nums.length === 0) {
    return api.sendMessage(
`╭────────────────╮
  ⎔  خطأ ❌
╰────────────────╯

 ╰─▫ أدخل أرقاماً صحيحة أو 0 للإلغاء

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`, threadID, messageID);
  }

  const { files, cmdPath } = handleReply;
  const deleted = [];
  const invalid = [];
  const errors = [];

  for (const num of nums) {
    if (num < 1 || num > files.length) {
      invalid.push(num);
      continue;
    }
    const fileName = files[num - 1];
    const filePath = path.join(cmdPath, fileName);
    try {
      fs.removeSync(filePath);
      global.client.commands.delete(fileName.replace(".js", ""));
      deleted.push(fileName.replace(".js", ""));
    } catch (e) {
      errors.push(fileName.replace(".js", ""));
    }
  }

  global.client.handleReply = global.client.handleReply.filter(
    r => r.messageID !== handleReply.messageID
  );

  let resultMsg = `╭────────────────╮\n  ⎔  نتيجة الحذف 🗑️\n╰────────────────╯\n\n`;

  if (deleted.length > 0) {
    resultMsg += ` ⊞ ◜ تـم الـحـذف بـنـجـاح ✅ ◞\n`;
    deleted.forEach(name => { resultMsg += ` ├─▫ ${name}\n`; });
    resultMsg += "\n";
  }

  if (invalid.length > 0) {
    resultMsg += ` ⊞ ◜ أرقـام غـيـر صـالـحـة ⚠️ ◞\n`;
    invalid.forEach(n => { resultMsg += ` ├─▫ رقم ${n} غير موجود\n`; });
    resultMsg += "\n";
  }

  if (errors.length > 0) {
    resultMsg += ` ⊞ ◜ فـشـل الـحـذف ❌ ◞\n`;
    errors.forEach(name => { resultMsg += ` ├─▫ ${name}\n`; });
    resultMsg += "\n";
  }

  resultMsg +=
`  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`;

  return api.sendMessage(resultMsg, threadID, messageID);
};
