module.exports.config = {
  name: "ابتايم",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Mustapha",
  description: "إحصائيات النظام",
  commandCategory: "النظام",
  usages: "ابتايم",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, Users }) {
  const moment = require("moment-timezone");
  const os = require("os");

  const uptime = process.uptime();
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  const uptimeStr = `${d}d ${h}h ${m}m ${s}s`;

  const startTime = new Date(Date.now() - uptime * 1000);
  const startStr = moment(startTime).tz("Africa/Khartoum").format("YYYY/MM/DD ◦ hh:mm A");

  const threads = await api.getThreadList(100, null, ["INBOX"]);
  const groupCount = threads.filter(t => t.isGroup).length;

  const pingStart = Date.now();
  await new Promise(res => api.getUserInfo(event.senderID, () => res()));
  const ping = Date.now() - pingStart;

  const mem = process.memoryUsage();
  const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);
  const heapTotal = toMB(mem.heapTotal);
  const heapUsed = toMB(mem.heapUsed);
  const totalMem = toMB(os.totalmem());

  const cpuLoad = os.loadavg()[0];
  const cpuPercent = (cpuLoad * 100 / os.cpus().length).toFixed(2);

  const now = moment.tz("Africa/Khartoum");
  const time = now.format("hh:mm:ss A");
  const date = now.format("YYYY/MM/DD");

  const days = {
    "Sunday": "الأحد",
    "Monday": "الاثنين",
    "Tuesday": "الثلاثاء",
    "Wednesday": "الأربعاء",
    "Thursday": "الخميس",
    "Friday": "الجمعة",
    "Saturday": "السبت"
  };
  const dayName = days[now.format("dddd")] || now.format("dddd");

  const message = `╭────────────────╮
  ⎔  SYSTEM METRICS & UPTIME
╰────────────────╯

 ⊞ ◜ الـمـؤشـرات الـحـيـة ◞
 ├─▫ الـتـشـغـيـل: ${uptimeStr}
 ├─▫ بـدء الـنـظـام: ${startStr}
 ├─▫ الـمـجـمـوعـات: ${groupCount} ديرّة نشطة
 ├─▫ الاسـتـجـابـة: ${ping}ms
 ╰─▫ حـالـة الـبـوت: Active

 ⊞ ◜ مـوارد الاسـتـضـافـة ◞
 ├─▫ الـكـومـة الإجـمـالـيـة: ${heapTotal} MB
 ├─▫ الـمـسـتـهـلـك الـفـعـلـي: ${heapUsed} MB
 ├─▫ الـذاكـرة الـكـلـيـة: ${totalMem} MB
 ├─▫ ضـغـط الـمـعـالـج: ${cpuPercent}%
 ╰─▫ الـنـظـام: ${os.platform()} (${os.arch()})

 ⊞ ◜ تـوقـيـت الـسـودان ◞
 ├─▫ الـيـوم: ${dayName}
 ├─▫ الـسـاعـة: ${time}
 ╰─▫ الـتـاريـخ: ${date}

  ⎔────────────────⎔
   ⌬ ʀʏᴜᴢᴀᴋɪ ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ ⌬
  ⎔────────────────⎔`;

  return api.sendMessage(message, event.threadID, event.messageID);
};
