const { readDB, writeDB, getUser, updateUserMoney, checkDebts } = require('../db');

module.exports = {
    name: 'borc',
    description: 'Banklardan 3 günlük müddətə borc götürmək paneli',
    prefixRequired: true,
    async execute(message, args) {
        // Əvvəlcə borc vaxtı keçibsə cəzanı tətbiq et
        await checkDebts(message);

        const requestedAmount = parseFloat(args[0]);

        if (isNaN(requestedAmount) || requestedAmount <= 0) {
            return message.reply('❌ Nə qədər borc almaq istədiyini yaz! Örnək: `!borc 500`');
        }

        const user = getUser(message.author.id);

        if (user.debt > 0) {
            return message.reply(`❌ Sənin zatən **${user.debt.toFixed(2)} AZN** ödənməmiş bank borcun var! Yeni borc almaq üçün əvvəlcə köhnəni bağla.`);
        }

        const banks = [
            { id: 1, name: "Birbank (Kapital)", rate: 14, text: "%14 Faizli nağd kredit" },
            { id: 2, name: "ABB (Azərbaycan Beynəlxalq Bankı)", rate: 12, text: "%12 Sərfəli dövlət bankı krediti" },
            { id: 3, name: "Unibank (ALBALI)", rate: 16, text: "%16 Tez və sənədsiz kredit" }
        ];

        let msgContent = `🏦 **AZƏRBAYCAN BANKLARI KREDİT PANENLİ** 🏦\n`;
        msgContent += `💵 İstənilən məbləğ: **${requestedAmount.toFixed(2)} AZN**\n`;
        msgContent += `⏳ Krediti ödəmək üçün vaxt: **3 GÜN (72 saat)**\n⚠️ *Vaxtında ödənilməsə 2 qat cərimə çıxılacaq, pul yoxdursa MUTE olacaqsınız!*\n\n`;
        msgContent += `Aşağıdakı banklardan birini seçmək üçün **1**, **2** və ya **3** yazın:\n\n`;

        banks.forEach(b => {
            const totalRepay = requestedAmount + (requestedAmount * (b.rate / 100));
            msgContent += `**[ Option ${b.id} ] - ${b.name}**\n📌 Şərt: ${b.text}\n💵 Veriləcək Pul: **${requestedAmount.toFixed(2)} AZN**\n📉 Geri Ödəniləcək Pul: **${totalRepay.toFixed(2)} AZN**\n───────────────────\n`;
        });

        await message.reply(msgContent);

        const filter = m => m.author.id === message.author.id && ['1', '2', '3'].includes(m.content.trim());

        try {
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 25000, errors: ['time'] });
            const selectedId = parseInt(collected.first().content.trim());
            const selectedBank = banks.find(b => b.id === selectedId);

            const totalRepay = requestedAmount + (requestedAmount * (selectedBank.rate / 100));

            // Pulu əlavə edirik, 3 günlük vaxt təyin edirik (3 gün = 3 * 24 * 60 * 60 * 1000 ms)
            updateUserMoney(message.author.id, requestedAmount);
            
            const db = readDB();
            const dueDate = Date.now() + (3 * 24 * 60 * 60 * 1000);
            
            db.users[message.author.id].debt = totalRepay;
            db.users[message.author.id].debtDueDate = dueDate;
            db.users[message.author.id].bankName = selectedBank.name;
            db.users[message.author.id].interestRate = selectedBank.rate;
            writeDB(db);

            return message.channel.send(`✅ **Kredit təsdiqləndi!**\n🏦 Bank: **${selectedBank.name}**\n💰 Hesabına köçürüldü: **+${requestedAmount.toFixed(2)} AZN**\n💳 Geri ödəniləcək məbləğ: **${totalRepay.toFixed(2)} AZN**\n📅 Son Ödəniş Müddəti: **3 GÜN İÇİNDƏ**`);

        } catch (e) {
            return message.channel.send('⏰ Vaxt bitdi! Seçim edilmədiyi üçün kredit müraciəti ləğv olundu.');
        }
    }
};