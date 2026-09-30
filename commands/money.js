const { getUser } = require('../db');

module.exports = {
    name: 'money',
    description: 'Cari balansını gösterir',
    prefixRequired: true,
    execute(message, args) {
        const user = getUser(message.author.id);
        return message.reply(`💰 Sənin çantaında **${user.money.toFixed(2)} AZN** pul var.`);
    }
};