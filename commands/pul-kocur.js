const { getUser, updateUserMoney } = require('../db');

module.exports = {
    name: 'pul-kocur',
    description: 'Başqa bir istifadəçiyə pul köçürür',
    prefixRequired: true,
    async execute(message, args) {
        const targetUser = message.mentions.users.first();
        const amount = parseFloat(args[1]);

        if (!targetUser) {
            return message.reply('❌ Pul göndərmək istədiyin dostunu etiketlə! Örnək: `!pul-kocur @user 50`');
        }

        if (targetUser.id === message.author.id) {
            return message.reply('❌ Özün özünə pul göndərə bilməzsən!');
        }

        if (targetUser.bot) {
            return message.reply('❌ Bota pul göndərmək olmaz!');
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Göndərmək istədiyin məbləği düzgün yaz!');
        }

        const sender = getUser(message.author.id);

        if (sender.money < amount) {
            return message.reply(`❌ Kifayət qədər pulun yoxdur! Balansın: **${sender.money.toFixed(2)} AZN**`);
        }

        // Göndərəndən çıxırıq, alana əlavə edirik
        updateUserMoney(message.author.id, -amount);
        updateUserMoney(targetUser.id, amount);

        return message.reply(`💸 <@${message.author.id}> uğurla <@${targetUser.id}> hesabına **${amount.toFixed(2)} AZN** pul köçürdü!`);
    }
};