module.exports = {
    name: 'sa',
    description: 'Salamlaşma əmri',
    prefixRequired: false, // Prefikssiz (tək "sa" yazanda) işləsin
    execute(message, args) {
        return message.reply('Aleykum salam! Xoş gəldin');
    }
};