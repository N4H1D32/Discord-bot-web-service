const { readDB, writeDB, getUser, updateUserMoney } = require('../db');
const { parts } = require('../partsConfig');

module.exports = {
    name: 'sanayi',
    description: 'Xarab olan parçaları təmir edir',
    prefixRequired: true,
    async execute(message, args) {
        const db = readDB();

        if (!db.brokenParts || db.brokenParts.length === 0) {
            return message.reply('🔧 Hyundai Accent saat kimi işləyir! Heç bir parça xarab deyil.');
        }

        const user = getUser(message.author.id);
        
        // Bütün xarab parçaların ümumi qiyməti
        let totalCost = 0;
        db.brokenParts.forEach(pKey => {
            if (parts[pKey]) totalCost += parts[pKey].repairCost;
        });

        if (user.money < totalCost) {
            return message.reply(`❌ **Sanayidə ustalar maşını saxladı!**\n🔧 Təmir üçün ümumi **${totalCost} AZN** lazımdır.\n💰 Sənin balansın: **${user.money.toFixed(2)} AZN**.\n\n💡 Kifayət qədər pulunuz yoxdur, maşın usta yanında qalır!`);
        }

        // Pulu çıxırıq
        updateUserMoney(message.author.id, -totalCost);

        // Mute-ları açırıq
        for (const pKey of db.brokenParts) {
            const pObj = parts[pKey];
            if (pObj && pObj.userId) {
                try {
                    const member = await message.guild.members.fetch(pObj.userId);
                    if (member) {
                        await member.voice.setMute(false, "Parça sanayidə təmir olundu!").catch(() => {});
                        await member.timeout(null).catch(() => {}); // Chat mutesini qaldırır
                    }
                } catch (err) {
                    console.log("Unmute xətası:", err.message);
                }
            }
        }

        const repairedNames = db.brokenParts.map(p => parts[p] ? parts[p].name : p).join(', ');
        db.brokenParts = []; // Parçaları sıfırlayırıq
        writeDB(db);

        return message.reply(`👨‍🔧 **Usta işini təmiz gördü!**\n🛠️ Təmir olunan parçalar: **${repairedNames}**\n💵 Ödənilən məbləğ: **${totalCost} AZN**\n Maşın yenidən yola hazırdır 🚗💨`);
    }
};