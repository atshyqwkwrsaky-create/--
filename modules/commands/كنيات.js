module.exports.config = {
  name: "كنيات",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "Gemini",
  description: "تعيين كنية موحدة لـ 250 عضو مع استبدال كلمة اسم بالاسم الأول",
  commandCategory: "المطور",
  usages: "[الكنية تحتوي على كلمة اسم]",
  cooldowns: 20
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminID = "61563738496733"; 

  if (senderID !== adminID) {
    return api.sendMessage("⚠️ عذراً، هذا الأمر مخصص لمطور البوت فقط.", threadID, messageID);
  }

  const format = args.join(" ");
  if (!format || !format.includes("اسم")) {
    return api.sendMessage("⚠️ يرجى كتابة التنسيق المطلوب مع كلمة 'اسم'.\nمثال: كنيات [اسم] ملك البوت", threadID, messageID);
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    // جلب أول 250 عضو فقط
    const userIDs = threadInfo.participantIDs.slice(0, 250);
    let successCount = 0;

    api.sendMessage(`⏳ جاري بدء العملية لـ ${userIDs.length} عضو...\n⚠️ سيتم تغيير كنية كل عضو بفاصل زمني لتجنب الحظر.`, threadID);

    for (let id of userIDs) {
      try {
        const userInfo = await api.getUserInfo(id);
        const fullName = userInfo[id].name;
        const firstName = fullName.split(" ")[0];

        // استبدال كلمة "اسم" بأقواسها بالاسم الأول
        const newNickname = format.replace(/[\(\[\{\<\«]*اسم[\)\}\]\>\»]*/g, firstName);

        // تنفيذ التغيير
        await new Promise(resolve => {
          api.changeNickname(newNickname, threadID, id, () => {
            successCount++;
            resolve();
          });
        });

        // فاصل زمني بسيط (1.5 ثانية) بين كل عضو لتجنب السبام
        await new Promise(res => setTimeout(res, 1500));
        
      } catch (err) {
        console.error("فشل تغيير كنية العضو: " + id);
      }
    }

    return api.sendMessage(`✅ اكتملت العملية!\n🔹 تم تغيير: ${successCount} كنية.\n🔹 التنسيق المستخدم: ${format}`, threadID, messageID);

  } catch (e) {
    return api.sendMessage("❌ حدث خطأ في النظام: " + e.message, threadID, messageID);
  }
};
