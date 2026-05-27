const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تعديل_حدث",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Ryuzaki Dev",
  description: "تعديل أكواد ملفات الأحداث (Events) مباشرة من الشات",
  commandCategory: "مطور",
  usages: "تعديل_حدث",
  usePrefix: false,
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const devID = "61563738496733";

  // حماية الأمر وجعله خاص بالمطور المحدد فقط
  if (String(senderID) !== devID) {
    return api.sendMessage(
`╭────────────────╮
  ⎔  رفض الوصول 🚫
╰────────────────╯

 ╰─▫ هذا الأمر للمطور الأساسي فقط

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`, threadID, messageID);
  }

  // تحديد مسار مجلد الأحداث (تلقائياً يفترض وجوده بجانب مجلد الأوامر أو يتم تحديده بدقة)
  // تم استخدام المسار القياسي لمجلد الأحداث في سورس ميراي/ميركوري
  const eventsPath = path.join(__dirname, "..", "events");
  
  if (!fs.existsSync(eventsPath)) {
    return api.sendMessage("❌ لم يتم العثور على مجلد الأحداث (events).", threadID, messageID);
  }

  const files = fs.readdirSync(eventsPath)
    .filter(f => f.endsWith(".js"))
    .sort();

  if (files.length === 0) {
    return api.sendMessage("لا توجد ملفات أحداث حالياً.", threadID, messageID);
  }

  let list = "";
  files.forEach((file, i) => {
    let displayName = file.replace(".js", "");
    let desc = "";
    try {
      const eventFile = require(path.join(eventsPath, file));
      if (eventFile.config) {
        if (eventFile.config.name) displayName = eventFile.config.name;
        if (eventFile.config.description) desc = ` — ${eventFile.config.description}`;
      }
    } catch (e) {}
    list += ` ${i + 1}. ${displayName}${desc}\n`;
  });

  const msg =
`╭────────────────╮
  ⎔  تعديل الأحداث ⚙️
╰────────────────╯

 ⊞ ◜ قـائـمـة الأحـداث (${files.length} حدث) ◞

${list}
 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 ├─▫ رد بـرقـم الحدث لتعديله
 ╰─▫ رد بـ 0 للإلغاء

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴ ⌬
  ⎔────────────────⎔`;

  return api.sendMessage(msg, threadID, (err, info) => {
    if (err) return;
    global.client.handleReply.push({
      name: "تعديل_حدث",
      step: 1,
      messageID: info.messageID,
      senderID: String(senderID),
      files: files,
      eventsPath: eventsPath
    });
  });
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (String(senderID) !== String(handleReply.senderID)) return;

  const input = (body || "").trim();

  // إلغاء العملية
  if (input === "0") {
    global.client.handleReply = global.client.handleReply.filter(r => r.messageID !== handleReply.messageID);
    return api.sendMessage(
`╭────────────────╮
  ⎔  تم الإلغاء ✅
╰────────────────╯

 ╰─▫ لم يتم تعديل أي حدث

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴ ⌬
  ⎔────────────────⎔`, threadID, messageID);
  }

  // --- المرحلة الأولى: اختيار الملف ---
  if (handleReply.step === 1) {
    const num = parseInt(input);
    if (isNaN(num) || num < 1 || num > handleReply.files.length) {
      return api.sendMessage("⚠️ رقم غير صحيح، يرجى اختيار رقم من القائمة الموضحة أعلاه أو 0 للإلغاء.", threadID, messageID);
    }

    const selectedFile = handleReply.files[num - 1];

    // الانتقال للمرحلة الثانية وطلب الكود الجديد
    return api.sendMessage(
`╭────────────────╮
  ⎔  انتظار الكود 💾
╰────────────────╯

 ├─▫ الملف المختار: ${selectedFile}
 ╰─▫ قم بالرد على هذه الرسالة بـ (الكود الجديد كاملاً) لـحفظه وتفعيله.

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴ ⌬
  ⎔────────────────⎔`, threadID, (err, info) => {
      if (err) return;
      // تحديث بيانات الـ handleReply للمرحلة التالية
      global.client.handleReply = global.client.handleReply.filter(r => r.messageID !== handleReply.messageID);
      global.client.handleReply.push({
        name: "تعديل_حدث",
        step: 2,
        messageID: info.messageID,
        senderID: String(senderID),
        selectedFile: selectedFile,
        eventsPath: handleReply.eventsPath
      });
    }, messageID);
  }

  // --- المرحلة الثانية: استقبال الكود وحفظه ---
  if (handleReply.step === 2) {
    if (!body) {
      return api.sendMessage("❌ يرجى إرسال نص برميجي صحيح لتحديث الملف.", threadID, messageID);
    }

    const filePath = path.join(handleReply.eventsPath, handleReply.selectedFile);
    const eventName = handleReply.selectedFile.replace(".js", "");

    try {
      // 1. كتابة الكود الجديد في الملف نهائياً
      fs.writeFileSync(filePath, body, "utf-8");

      // 2. مسح الكاش القديم للحدث من ذاكرة الـ Node.js لتحديثه
      delete require.cache[require.resolve(filePath)];

      // 3. إعادة تحميل الحدث الجديد في ذاكرة البوت
      const newEvent = require(filePath);
      
      if (newEvent.config && newEvent.config.name) {
        // حذف الحدث القديم من الذاكرة إذا كان موجوداً
        global.client.events.delete(eventName);
        // إضافة الحدث الجديد المطور
        global.client.events.set(newEvent.config.name, newEvent);
      }

      // إنهاء الحوار من الذاكرة
      global.client.handleReply = global.client.handleReply.filter(r => r.messageID !== handleReply.messageID);

      return api.sendMessage(
`╭────────────────╮
  ⎔  تم التحديث بنجاح ✅
╰────────────────╯

 ├─▫ الملف: ${handleReply.selectedFile}
 ├─▫ حالة السيرفر: تم كتابة الملف 💾
 ╰─▫ حالة البوت: تم إعادة تشغيل الحدث وتفعيله بنجاح تلقائياً ⚡

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴ ⌬
  ⎔────────────────⎔`, threadID, messageID);

    } catch (error) {
      return api.sendMessage(`❌ حدث خطأ أثناء الحفظ أو التفعيل المباشر:\n\n${error.message}`, threadID, messageID);
    }
  }
};
