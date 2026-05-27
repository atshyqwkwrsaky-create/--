const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ريلود",
  version: "1.0.0",
  hasPermssion: 2, // متاح للمطورين ومدراء البوت (عام لكل من يملك الصلاحية)
  credits: "Ryuzaki Dev",
  description: "إعادة تحميل وتحديث جميع الأوامر والأحداث في ذاكرة البوت فوراً",
  commandCategory: "مطور",
  usages: "ريلود",
  usePrefix: false,
  cooldowns: 5
};

module.exports.run = async function({ api, event, Args }) {
  const { threadID, messageID } = event;
  
  // الآيدي الخاص بك كمطور أساسي ثابت
  const primaryDevID = "61563738496733"; 

  // إرسال رسالة بدء العملية
  return api.sendMessage(
`╭────────────────╮
  ⎔  تحديث النظام 🔄
╰────────────────╯

 ├─▫ جاري إعادة تحميل الملفات...
 ╰─▫ يرجى الانتظار قليلاً

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`, threadID, async (err, info) => {
    if (err) return;

    let commandsCount = 0;
    let eventsCount = 0;
    let errorCommands = [];
    let errorEvents = [];

    // 1. إعادة تحميل الأوامر (Commands)
    const commandsPath = path.join(__dirname, "..", "commands");
    if (fs.existsSync(commandsPath)) {
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
      
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          
          if (command.config && command.config.name) {
            // تثبيت المطور الأساسي في الكريديتس أو الإعدادات داخلياً إذا لم يكن موجوداً
            if (!command.config.credits) command.config.credits = "Ryuzaki Dev";
            
            global.client.commands.delete(command.config.name);
            global.client.commands.set(command.config.name, command);
            commandsCount++;
          }
        } catch (error) {
          errorCommands.push(`${file}: ${error.message}`);
        }
      }
    }

    // 2. إعادة تحميل الأحداث (Events)
    const eventsPath = path.join(__dirname, "..", "events");
    if (fs.existsSync(eventsPath)) {
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
      
      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        try {
          delete require.cache[require.resolve(filePath)];
          const eventFile = require(filePath);
          
          if (eventFile.config && eventFile.config.name) {
            global.client.events.delete(eventFile.config.name);
            global.client.events.set(eventFile.config.name, eventFile);
            eventsCount++;
          }
        } catch (error) {
          errorEvents.push(`${file}: ${error.message}`);
        }
      }
    }

    // بناء رسالة النتيجة النهائية
    let resultMsg = 
`╭────────────────╮
  ⎔  اكتمل التحديث ✅
╰────────────────╯

 ├─▫ الأوامر النشطة: ${commandsCount} 🛠️
 ├─▫ الأحداث النشطة: ${eventsCount} ⚙️
 ╰─▫ المطور الأساسي: ${primaryDevID}\n`;

    // إذا كان هناك ملفات بها أخطاء يتم عرضها للمطور لإصلاحها
    if (errorCommands.length > 0 || errorEvents.length > 0) {
      resultMsg += `\n⚠️ ◜ ملفات تحتوي على أخطاء ◞\n`;
      if (errorCommands.length > 0) resultMsg += `• الأوامر:\n${errorCommands.join("\n")}\n`;
      if (errorEvents.length > 0) resultMsg += `• الأحداث:\n${errorEvents.join("\n")}\n`;
    }

    resultMsg += `
  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`;

    // تعديل الرسالة السابقة بالنتيجة الجديدة
    return api.sendMessage(resultMsg, threadID, messageID);
  }, messageID);
};
