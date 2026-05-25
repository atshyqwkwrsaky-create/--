const fs   = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "مدير",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ليفاي",
  description: "مدير الأوامر الذكي — إنشاء وتعديل وإدارة كاملة",
  commandCategory: "المطور",
  usages: "مدير | مدير [قائمة/اقرأ/اكتب/عدل/احذف/أضف/ملف/صحح]",
  cooldowns: 0
};

const DEV_IDS   = ["61563738496733", ""];
const CMDS_PATH = path.join(__dirname);
const ROOT_PATH = path.join(__dirname, "..", "..");
const EVNT_PATH = path.join(__dirname, "..", "events");
const SELF      = "مدير";

const BOT_FILES = {
  "config"        : path.join(ROOT_PATH, "config.json"),
  "index"         : path.join(ROOT_PATH, "index.js"),
  "main"          : path.join(ROOT_PATH, "main.js"),
  "listen"        : path.join(ROOT_PATH, "includes", "listen.js"),
  "handlecommand" : path.join(ROOT_PATH, "includes", "handle", "handleCommand.js"),
  "handleevent"   : path.join(ROOT_PATH, "includes", "handle", "handleEvent.js"),
  "handlereply"   : path.join(ROOT_PATH, "includes", "handle", "handleReply.js"),
};

function isAdmin(id) {
  if (DEV_IDS.includes(String(id))) return true;
  return ((global.config && global.config.ADMINBOT) || []).includes(String(id));
}

function listJS() {
  try { return fs.readdirSync(CMDS_PATH).filter(f => f.endsWith(".js")).sort(); }
  catch(e) { return []; }
}

function readSafe(fp, limit = 4000) {
  try {
    const c = fs.readFileSync(fp, "utf8");
    return c.length > limit ? c.slice(0, limit) + "\n\n…[مقطوع]" : c;
  } catch(e) { return null; }
}

function hotReload(fp) {
  try {
    delete require.cache[require.resolve(fp)];
    const mod = require(fp);
    if (mod.config && mod.config.name && global.client && global.client.commands) {
      global.client.commands.set(mod.config.name, mod);
      global.client.commands.set(mod.config.name.toLowerCase(), mod);
      return `⚡ تم تحميل "${mod.config.name}" فوراً ✅`;
    }
    return "⚠️ تم الحفظ — أعد التشغيل لتفعيله.";
  } catch(e) {
    return `⚠️ فيه خطأ في الكود:\n${e.message}`;
  }
}

function resolveCmdPath(name) {
  const n = name.endsWith(".js") ? name : name + ".js";
  const fp = path.join(CMDS_PATH, n);
  return fs.existsSync(fp) ? fp : null;
}

async function askAI(prompt) {
  try {
    const res = await axios.get("https://api.paxsenix.biz.id/ai/gpt4o", {
      params: { text: prompt },
      timeout: 40000
    });
    return (res.data && (res.data.message || res.data.result || res.data.text || res.data.reply)) || null;
  } catch(e) {
    try {
      const res2 = await axios.get("https://api.popcat.xyz/chatbot", {
        params: { msg: prompt, uid: "wayed_bot" },
        timeout: 20000
      });
      return (res2.data && res2.data.response) || null;
    } catch(e2) { return null; }
  }
}

const MENU =
`╭━━━━━━━━━━━━━━━━━━━━━━━╮
┃   🤖  W A Y E D  B O T  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯
╔══════════════════════╗
║   🤖 مدير الأوامر   ║
╚══════════════════════╝

📋 الأوامر المتاحة:
──────────────────────────────

📦 إدارة الأوامر:
• مدير قائمة
   ↳ عرض كل الأوامر

• مدير اقرأ [اسم]
   ↳ عرض كود أمر موجود

• مدير اكتب [اسم] [وصف]
   ↳ إنشاء أمر جديد بالذكاء

• مدير عدل [اسم] [الطلب]
   ↳ تعديل أمر موجود بالذكاء

• مدير احذف [اسم]
   ↳ حذف أمر

• مدير أضف [اسم]
   ↳ أرسل كودك وسيتم حفظه مباشرة

──────────────────────────────
📁 ملفات البوت:
• مدير ملف [اسم]
   ↳ قراءة ملف (config/index/main...)

• مدير صحح [اسم]
   ↳ الذكاء يفحص الملف ويصحح الأخطاء

──────────────────────────────
📁 الملفات المتاحة:
   • config  • index  • main
   • listen  • handlecommand
   • handleevent  • handlereply
   • [اسم أمر موجود]

━━━━━━━━━━━━━━━━━━━━━━━
        🌟 WAYED BOT 🌟`;

// ══════════════════════════════════════════════════════
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!isAdmin(senderID)) return api.sendMessage("🚫 حصري للمطور فقط.", threadID, messageID);

  const sub = (args[0] || "").trim();
  if (!sub) return api.sendMessage(MENU, threadID, messageID);

  // ── قائمة ──────────────────────────────────────────
  if (sub === "قائمة") {
    const files = listJS();
    const list  = files.map((f, i) => `${i + 1}. ${f.replace(".js", "")}`).join("\n");
    return api.sendMessage(
      `╔══════════════════════╗\n║   📋 قائمة الأوامر   ║\n╚══════════════════════╝\n\n${list}\n\n━━━━━━━━━━━━━━━━━━━━━━━\nالمجموع: ${files.length} أمر`,
      threadID, messageID
    );
  }

  // ── اقرأ [اسم] ────────────────────────────────────
  if (sub === "اقرأ") {
    const name = (args[1] || "").trim();
    if (!name) return api.sendMessage("❗ مثال: مدير اقرأ ابتايم", threadID, messageID);
    const fp = resolveCmdPath(name);
    if (!fp) return api.sendMessage(`❌ الأمر "${name}" غير موجود.`, threadID, messageID);
    const code = readSafe(fp);
    return api.sendMessage(
      `╔══════════════════════╗\n║  📖 ${name}  ║\n╚══════════════════════╝\n\n${code}\n\n━━━━━━━━━━━━━━━━━━━━━━━`,
      threadID, messageID
    );
  }

  // ── اكتب [اسم] [وصف] ──────────────────────────────
  if (sub === "اكتب") {
    const name = (args[1] || "").trim();
    const desc = args.slice(2).join(" ").trim();
    if (!name || !desc) return api.sendMessage("❗ مثال: مدير اكتب سلام يرد بتحية جميلة", threadID, messageID);

    api.sendMessage("🤖 الذكاء يكتب الكود...", threadID, async (err, loadMsg) => {
      const prompt =
`اكتب أمر JavaScript لبوت فيسبوك ماسنجر باسم "${name}".
الوصف: ${desc}
استخدم هذا الهيكل الصحيح فقط:
module.exports.config = { name: "${name}", version: "1.0.0", hasPermssion: 0, credits: "ليفاي", description: "${desc}", commandCategory: "عام", usages: "${name}", cooldowns: 3 };
module.exports.run = async function ({ api, event, args }) { const { threadID, messageID } = event; /* كود الأمر */ };
أعط الكود فقط بدون شرح.`;

      const code = await askAI(prompt);
      if (!err) api.unsendMessage(loadMsg.messageID);

      if (!code) {
        return api.sendMessage("❌ فشل الاتصال بالذكاء الاصطناعي، حاول مرة أخرى.", threadID, messageID);
      }

      const cleanCode = code.replace(/```(javascript|js)?/gi, "").replace(/```/g, "").trim();
      return api.sendMessage(
        `╔══════════════════════╗\n║  🤖 كود تم بالذكاء  ║\n╚══════════════════════╝\n\n${cleanCode}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ رد بـ "حفظ" لحفظه، أو أرسل كودك المعدّل.`,
        threadID,
        (e2, info) => {
          if (!e2) global.client.handleReply.push({
            name: SELF, author: senderID,
            messageID: info.messageID,
            type: "save_new", cmdName: name, generatedCode: cleanCode
          });
        },
        messageID
      );
    });
    return;
  }

  // ── عدل [اسم] [الطلب] ─────────────────────────────
  if (sub === "عدل") {
    const name    = (args[1] || "").trim();
    const request = args.slice(2).join(" ").trim();
    if (!name || !request) return api.sendMessage("❗ مثال: مدير عدل ابتايم أضف وقت التشغيل بالساعات", threadID, messageID);
    const fp = resolveCmdPath(name);
    if (!fp) return api.sendMessage(`❌ الأمر "${name}" غير موجود.`, threadID, messageID);

    const currentCode = readSafe(fp, 3000);
    api.sendMessage("🤖 الذكاء يعدّل الكود...", threadID, async (err, loadMsg) => {
      const prompt =
`هذا كود أمر بوت فيسبوك ماسنجر:
${currentCode}

الطلب: ${request}
عدّل الكود حسب الطلب واعطني الكود الكامل المعدّل فقط بدون شرح.`;

      const code = await askAI(prompt);
      if (!err) api.unsendMessage(loadMsg.messageID);

      if (!code) return api.sendMessage("❌ فشل الاتصال بالذكاء، حاول مرة أخرى.", threadID, messageID);

      const cleanCode = code.replace(/```(javascript|js)?/gi, "").replace(/```/g, "").trim();
      return api.sendMessage(
        `╔══════════════════════╗\n║  ✏️ كود معدّل بالذكاء ║\n╚══════════════════════╝\n\n${cleanCode}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ رد بـ "حفظ" لحفظه، أو أرسل كودك المعدّل.`,
        threadID,
        (e2, info) => {
          if (!e2) global.client.handleReply.push({
            name: SELF, author: senderID,
            messageID: info.messageID,
            type: "save_edit", cmdName: name, fp, generatedCode: cleanCode
          });
        },
        messageID
      );
    });
    return;
  }

  // ── احذف [اسم] ────────────────────────────────────
  if (sub === "احذف") {
    const name = (args[1] || "").trim();
    if (!name) return api.sendMessage("❗ مثال: مدير احذف ابتايم", threadID, messageID);
    const fp = resolveCmdPath(name);
    if (!fp) return api.sendMessage(`❌ الأمر "${name}" غير موجود.`, threadID, messageID);
    return api.sendMessage(
      `╔══════════════════════╗\n║  🗑️ تأكيد الحذف      ║\n╚══════════════════════╝\n\nهل تريد حذف: ${name}.js ؟\nرد بـ "نعم" للتأكيد أو "لا" للإلغاء.`,
      threadID,
      (err, info) => {
        if (!err) global.client.handleReply.push({
          name: SELF, author: senderID,
          messageID: info.messageID, type: "confirm_delete", fp, cmdName: name
        });
      },
      messageID
    );
  }

  // ── أضف [اسم] ← أرسل كود كرد ─────────────────────
  if (sub === "أضف" || sub === "اضف") {
    const name = (args[1] || "").trim();
    if (!name) return api.sendMessage("❗ مثال: مدير أضف سلام ثم أرسل الكود كرد", threadID, messageID);
    return api.sendMessage(
      `╔══════════════════════╗\n║  📝 إضافة كود يدوي   ║\n╚══════════════════════╝\n\nالأمر: ${name}.js\n\n⬆️ أرسل الكود كاملاً كـرد على هذه الرسالة.\n⚡ سيُحفظ ويُحمّل فوراً.`,
      threadID,
      (err, info) => {
        if (!err) global.client.handleReply.push({
          name: SELF, author: senderID,
          messageID: info.messageID, type: "write_code", cmdName: name
        });
      },
      messageID
    );
  }

  // ── ملف [اسم] ─────────────────────────────────────
  if (sub === "ملف") {
    const target = (args[1] || "").trim().toLowerCase();
    if (!target) {
      return api.sendMessage(
        `📁 الملفات المتاحة:\n━━━━━━━━━━━━━━━\n${Object.keys(BOT_FILES).join("\n")}\n━━━━━━━━━━━━━━━\nاستخدام: مدير ملف config`,
        threadID, messageID
      );
    }
    const fp = BOT_FILES[target] || resolveCmdPath(target);
    if (!fp || !fs.existsSync(fp)) return api.sendMessage(`❌ الملف "${target}" غير موجود.`, threadID, messageID);
    const code = readSafe(fp, 3500);
    return api.sendMessage(
      `╔══════════════════════╗\n║  📁 ${target}  ║\n╚══════════════════════╝\n\n${code}\n\n━━━━━━━━━━━━━━━━━━━━━━━`,
      threadID, messageID
    );
  }

  // ── صحح [اسم] ─────────────────────────────────────
  if (sub === "صحح") {
    const name = (args[1] || "").trim();
    if (!name) return api.sendMessage("❗ مثال: مدير صحح ابتايم", threadID, messageID);
    const fp = BOT_FILES[name.toLowerCase()] || resolveCmdPath(name);
    if (!fp || !fs.existsSync(fp)) return api.sendMessage(`❌ الملف "${name}" غير موجود.`, threadID, messageID);

    const code = readSafe(fp, 3000);
    api.sendMessage("🔍 الذكاء يفحص الأخطاء...", threadID, async (err, loadMsg) => {
      const prompt =
`افحص هذا الكود JavaScript وصحح الأخطاء فيه:
${code}
أعطني الكود المصحح كاملاً فقط بدون شرح.`;

      const fixed = await askAI(prompt);
      if (!err) api.unsendMessage(loadMsg.messageID);

      if (!fixed) return api.sendMessage("❌ فشل الاتصال بالذكاء، حاول مرة أخرى.", threadID, messageID);

      const cleanFixed = fixed.replace(/```(javascript|js)?/gi, "").replace(/```/g, "").trim();
      return api.sendMessage(
        `╔══════════════════════╗\n║  🔧 كود مصحح بالذكاء ║\n╚══════════════════════╝\n\n${cleanFixed}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ رد بـ "حفظ" لحفظ التصحيح، أو "لا" للإلغاء.`,
        threadID,
        (e2, info) => {
          if (!e2) global.client.handleReply.push({
            name: SELF, author: senderID,
            messageID: info.messageID,
            type: "save_fix", fp, cmdName: name, generatedCode: cleanFixed
          });
        },
        messageID
      );
    });
    return;
  }

  return api.sendMessage(`❓ غير معروف: "${sub}"\nاكتب مدير للقائمة.`, threadID, messageID);
};

// ══════════════════════════════════════════════════════
// handleReply
// ══════════════════════════════════════════════════════
module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (!isAdmin(senderID)) return;
  if (String(senderID) !== String(handleReply.author)) return;

  const input = body.trim();

  // ── حفظ أمر جديد (من اكتب) ──────────────────────
  if (handleReply.type === "save_new") {
    const { cmdName, generatedCode } = handleReply;
    const code = input.toLowerCase() === "حفظ" ? generatedCode : input;
    const fp   = path.join(CMDS_PATH, `${cmdName}.js`);
    try {
      fs.writeFileSync(fp, code, "utf8");
      const msg = hotReload(fp);
      return api.sendMessage(`✅ تم إنشاء: ${cmdName}.js\n${msg}`, threadID, messageID);
    } catch(e) { return api.sendMessage(`❌ فشل: ${e.message}`, threadID, messageID); }
  }

  // ── حفظ تعديل (من عدل) ───────────────────────────
  if (handleReply.type === "save_edit") {
    const { cmdName, fp, generatedCode } = handleReply;
    const code = input.toLowerCase() === "حفظ" ? generatedCode : input;
    try {
      fs.writeFileSync(fp, code, "utf8");
      const msg = hotReload(fp);
      return api.sendMessage(`✅ تم تعديل: ${cmdName}.js\n${msg}`, threadID, messageID);
    } catch(e) { return api.sendMessage(`❌ فشل: ${e.message}`, threadID, messageID); }
  }

  // ── حفظ تصحيح (من صحح) ───────────────────────────
  if (handleReply.type === "save_fix") {
    const { fp, cmdName, generatedCode } = handleReply;
    if (input !== "حفظ") return api.sendMessage("❌ تم إلغاء التصحيح.", threadID, messageID);
    try {
      fs.writeFileSync(fp, generatedCode, "utf8");
      const msg = hotReload(fp);
      return api.sendMessage(`✅ تم حفظ التصحيح: ${cmdName}\n${msg}`, threadID, messageID);
    } catch(e) { return api.sendMessage(`❌ فشل: ${e.message}`, threadID, messageID); }
  }

  // ── كتابة كود يدوي (من أضف) ──────────────────────
  if (handleReply.type === "write_code") {
    const { cmdName } = handleReply;
    const fp = path.join(CMDS_PATH, `${cmdName}.js`);
    try {
      fs.writeFileSync(fp, input, "utf8");
      const msg = hotReload(fp);
      return api.sendMessage(`✅ تم حفظ: ${cmdName}.js\n${msg}`, threadID, messageID);
    } catch(e) { return api.sendMessage(`❌ فشل: ${e.message}`, threadID, messageID); }
  }

  // ── تأكيد حذف ────────────────────────────────────
  if (handleReply.type === "confirm_delete") {
    const { fp, cmdName } = handleReply;
    if (input !== "نعم") return api.sendMessage("❌ تم إلغاء الحذف.", threadID, messageID);
    try {
      fs.unlinkSync(fp);
      try {
        delete require.cache[require.resolve(fp)];
        global.client.commands && global.client.commands.delete(cmdName);
        global.client.commands && global.client.commands.delete(cmdName.toLowerCase());
      } catch(e) {}
      return api.sendMessage(`✅ تم حذف: ${cmdName}.js 🗑️`, threadID, messageID);
    } catch(e) { return api.sendMessage(`❌ فشل الحذف: ${e.message}`, threadID, messageID); }
  }
};
