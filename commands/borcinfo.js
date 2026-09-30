const { getUser } = require('../db');

module.exports = {
    name: 'borcinfo',
    description: 'Aktiv bank borcu haqqında ətraflı məlumat verir',
    prefixRequired: true,
    execute(message, args) {
        const user = getUser(message.author.id);

        if (!user.debt || user.debt <= 0) {
            return message.reply('🎉 **Aktiv borcun yoxdur!** İndi heç bir banka kredit borcun bulunmur.');
        }

        // Qalan vaxtı (gün, saat, dəqiqə) hesablamaq
        const now = Date.now();
        const diffMs = user.debtDueDate - now;

        let timeRemainingText = "";
        if (diffMs <= 0) {
            timeRemainingText = "🚨 **VAXTI BİTİB!** (İlk mesajda cərimə tətbiq olunacaq)";
        } else {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            timeRemainingText = `⏳ **${days} gün, ${remainingHours} saat, ${minutes} dəqiqə**`;
        }

        const infoMsg = `
🏦 **KREDİT VƏ BORC MƏLUMAT PANELİ** 🏦
──────────────────────────────
🏦 **Götürülən Bank:** ${user.bankName || "Bilinmir"}
📊 **Kredit Faizi:** %${user.interestRate || 0}
📉 **Ödənilməli Ümumi Məbləğ:** **${user.debt.toFixed(2)} AZN**
📅 **Qalan Vaxt:** ${timeRemainingText}
──────────────────────────────
⚠️ *Vaxtında ödənməzsə 2 qat cərimə olunacaq və ya MUTE tətbiq ediləcək!*
💡 *Borcu ödəmək üçün:* \`!borc-ode\`
        `;

        return message.reply(infoMsg);
    }
};