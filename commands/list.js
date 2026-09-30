const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'list',
    description: 'Botda olan bütün komutları və açıqlamalarını göstərir',
    prefixRequired: true,
    execute(message, args) {
        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        let replyMessage = `📋 **BOTDA OLAN BÜTÜN KOMUTLAR VƏ AÇIQLAMALARI** 📋\n`;
        replyMessage += `──────────────────────────────\n\n`;

        commandFiles.forEach(file => {
            try {
                const command = require(`./${file}`);
                if (command.name && command.description) {
                    replyMessage += `🔹 **!${command.name}** - ${command.description}\n`;
                }
            } catch (err) {
                console.error(`Fayl oxunarkən xəta baş verdi (${file}):`, err);
            }
        });

        replyMessage += `\n──────────────────────────────\n`;
        replyMessage += `💡 *İstənilən komutu işlətmək üçün önünə "!" işarəsi qoyun.*`;

        return message.reply(replyMessage);
    }
};