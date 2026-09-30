const { readDB, writeDB, getUser, updateUserMoney } = require('../db');

module.exports = {
    name: 'benzin',
    description: 'Baka benzin vurur',
    prefixRequired: true,
    execute(message, args) {
        const percent = parseInt(args[0]);

        if (isNaN(percent) || percent <= 0) {
            return message.reply('❌ Zəhmət olmasa neçə faiz benzin vurmaq istədiyini yaz! Örnək: `!benzin 10`');
        }

        const db = readDB();
        if (db.fuel >= 100) {
            return message.reply('⛽ Hyundai Accent-in çəni zatən 100% doludur!');
        }

        let actualAdd = percent;
        if (db.fuel + actualAdd > 100) {
            actualAdd = 100 - db.fuel;
        }

        // Hesablama: 50 litrlik bak, 1 litr AI-92 = 1.10 AZN
        // 1% = 0.5 litr = 0.55 AZN
        const cost = actualAdd * 0.55;
        const user = getUser(message.author.id);

        if (user.money < cost) {
            return message.reply(`❌ Kifayət qədər pulun yoxdur! **${actualAdd}%** benzin vurmaq üçün **${cost.toFixed(2)} AZN** lazımdır. Səndə olan: **${user.money.toFixed(2)} AZN**`);
        }

        updateUserMoney(message.author.id, -cost);
        db.fuel += actualAdd;
        writeDB(db);

        return message.reply(`⛽ **${actualAdd}%** benzin vuruldu! **${cost.toFixed(2)} AZN** ödənildi.\n🚗 Cari Benzin Səviyyəsi: **%${db.fuel.toFixed(1)}**\n💰 Qalan pulun: **${(user.money - cost).toFixed(2)} AZN**`);
    }
};