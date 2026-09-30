const { readDB, writeDB, getUser, updateUserMoney } = require('../db');

module.exports = {
    name: 'moyka',
    description: 'Maşını yuyaraq təmizlik səviyyəsini 100% edir',
    prefixRequired: true,
    execute(message, args) {
        const db = readDB();

        if (db.cleanliness >= 100) {
            return message.reply('🧼 **Hyundai Accent** zatən tertemizdir, güzgü kimi parıldayır!');
        }

        const user = getUser(message.author.id);
        const washCost = 15; // Moyka qiyməti 15 AZN

        if (user.money < washCost) {
            return message.reply(`❌ Moyka pulun çatmir! Təmizlik üçün **${washCost} AZN** lazımdır. Balansın: **${user.money.toFixed(2)} AZN**`);
        }

        updateUserMoney(message.author.id, -washCost);
        db.cleanliness = 100;
        writeDB(db);

        return message.reply(`🧼🧽 **Maşın kopuk-kopuk yuyuldu!**\n✨ Təmizlik Səviyyəsi: **%100**\n💵 Ödənilən məbləğ: **${washCost} AZN**\n🚘 Accent indi yollarda bülbül kimi ötür!`);
    }
};