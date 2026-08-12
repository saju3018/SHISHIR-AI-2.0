const axios = require("axios");

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tiksearch", "tt"],
    version: "1.1",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search TikTok videos" },
    category: "search",
    guide: { en: "{pn} <keyword>" }
  },

  onStart: async function ({ message, args, event, api }) {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const keyword = args.join(" ").trim();
      if (!keyword) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("❌ Please provide a keyword.\n\nExample:\ntt Zoro");
      }

      
      let res;
      try {
        res = await axios.get(`https://toshiro-api-editz6t9.vercel.app/api/search/tiksearch?keyword=${encodeURIComponent(keyword)}`, {timeout: 15000});
      } catch(e) {
        // API 2 backup
        res = await axios.get(`https://api.tikwm.com/video/feed/search?keywords=${encodeURIComponent(keyword)}&count=1`, {timeout: 15000});
      }

      const data = res.data;
      let videoUrl, title, author, duration;

      if(data.success && data.result?.video){ // API 1
        videoUrl = data.result.video;
        title = data.result.title;
        author = data.result.author;
        duration = data.result.duration;
      }
      else if(data.data?.videos?.[0]){ // API 2
        videoUrl = data.data.videos[0].play;
        title = data.data.videos[0].title;
        author = data.data.videos[0].author.nickname;
        duration = data.data.videos[0].duration;
      }
      else {
        throw new Error("No video found");
      }

      const video = (await axios.get(videoUrl, { responseType: "stream", timeout: 20000 })).data;
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const sentMsg = await message.reply({
        body: `╭━━━━━━━━━━━━╮\n🎵 𝑻𝒊𝒌𝑻𝒐𝒌 𝑺𝒆𝒂𝒓𝒄𝒉\n╰━━━━━━━━━━━━╯\n🔍 𝗞𝗲𝘆𝘄𝗼𝗿𝗱: ${keyword}\n🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗖𝗿𝗲𝗮𝘁𝗼𝗿: ${author}\n⏳ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${duration}s`,
        attachment: video
      });

      setTimeout(() => api.unsendMessage(sentMsg.messageID), 15000);

    } catch (err) {
      console.error("TT Error:", err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(`❌ Failed to search TikTok\nReason: ${err.message}\n\nTry again later or change keyword.`);
    }
  }
};
