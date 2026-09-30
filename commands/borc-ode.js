const { readDB, writeDB, getUser, updateUserMoney } = require('../db');

module.exports = {
    name: 'borc-ode',
    description: 'Banka olan kredit borcunu ödəyir',
    prefixRequired: true,
    async execute(message, args) {
        const user = getUser(message.author.id);

        if (!user.debt || user.debt <= 0) {
            return message.reply('🎉 **Təbriklər!** Sənin heç bir banka ödənməmiş borcun yoxdur.');
        }

        if (user.money <= 0) {
            return message.reply(`❌ **Ödəniş etmək üçün balansında pul yoxdur!**\n💳 Cari borcun: **${user.debt.toFixed(2)} AZN**\n💰 Balansın: **${user.money.toFixed(2)} AZN**`);
        }

        const db = readDB();

        if (user.money >= user.debt) {
            const paidAmount = user.debt;
            updateUserMoney(message.author.id, -paidAmount);
            
            db.users[message.author.id].debt = 0;
            db.users[message.author.id].debtDueDate = null; // Vaxtı sıfırlayırıq
            db.users[message.author.id].bankName = null;     // Bank adını sıfırlayırıq
            db.users[message.author.id].interestRate = null; // Faizi sıfırlayırıq
            writeDB(db);

            return message.reply(`✅ **Kredit borcu tam bağlandı!**\n💵 Ödənilən məbləğ: **${paidAmount.toFixed(2)} AZN**\n🎉 Banka olan borcun sıfırlandı!`);
        } else {
            const paidAmount = user.money;
            db.users[message.author.id].debt -= paidAmount;
            updateUserMoney(message.author.id, -paidAmount);
            writeDB(db);

            return message.reply(`📉 **Kredit borcunun bir hissəsi ödənildi!**\n💵 Ödənilən məbləğ: **${paidAmount.toFixed(2)} AZN**\n💳 Qalan bank borcun: **${db.users[message.author.id].debt.toFixed(2)} AZN**`);
        }
    }
};