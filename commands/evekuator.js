const { readDB, writeDB, getUser, updateUserMoney } = require('../db');

module.exports = {
    name: 'evekuator',
    description: 'Yolda qalan maşını evakuatorla YDM-yə aparır',
    prefixRequired: true,
    async execute(message, args) {
        const db = readDB();

        if (db.fuel > 0) {
            return message.reply(`🚘 **Maşın yolda qalmayıb!** Çəndə **%${db.fuel.toFixed(1)}** benzin var. Evakuatora ehtiyac yoxdur.`);
        }

        const user = getUser(message.author.id);
        const evakuatorCost = 35; // Bakıda evakuator qiyməti (35 AZN)

        if (user.money < evakuatorCost) {
            return message.reply(`❌ **Evakuator pulun çatmir!**\n🚚 Evakuator xidməti: **${evakuatorCost} AZN**\n💰 Səndə olan pul: **${user.money.toFixed(2)} AZN**\n\n💡 Dostlarından \`!transfer\` ilə pul istəyə bilərsən!`);
        }

        // Pulu çıxırıq və YDM-ə çatdırıb %10 benzin veririk
        updateUserMoney(message.author.id, -evakuatorCost);
        db.fuel = 10; // Xodlanıb benzin doldurmağa çatacaq qədər
        writeDB(db);

        return message.reply(`🚚💨 **Evakuator gəldi!**\n📍 Maşın yoldan götürülüb ən yaxın YDM-yə (Zapravkaya) çatdırıldı.\n💵 Ödənilən evakuator haqqı: **${evakuatorCost} AZN**\n⛽ Çənə başlanğıc üçün **%10** benzin töküldü.\n\n💡 İndi \`!benzin <faiz>\` yazaraq bakı tam doldura bilərsiniz!`);
    }
};