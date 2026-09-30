const activeSpams = new Map();

module.exports = {
    name: 'tag',
    description: 'Maksimum sürətlə tag atır',
    prefixRequired: true,
    async execute(message, args) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ **Bu əmri yalnız İnzibatçılar istifadə edə bilər!**');
        }

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'dur' || subCommand === 'stop') {
            if (activeSpams.has(message.channel.id)) {
                clearInterval(activeSpams.get(message.channel.id));
                activeSpams.delete(message.channel.id);
                return message.channel.send('🛑 **Tag göndərilməsi dayandırıldı!**');
            } else {
                return message.reply('⚠️ **Aktiv işləyən tag prosesi yoxdur.**');
            }
        }

        let totalTags = parseInt(args[0]) || 1000;
        if (totalTags > 1000) totalTags = 1000;

        const tagType = args[1]?.toLowerCase() === 'here' ? '@here' : '@everyone';

        if (activeSpams.has(message.channel.id)) {
            return message.reply('⚠️ **Bu kanalda artıq tag göndərilir! Dayandırmaq üçün `!tag dur` yazın.**');
        }

        await message.channel.send(`⚡ **Maksimum Sürət Aktiv Edildi!** Total **${totalTags}** tag atılacaq.`);

        let sentCount = 0;

        // Discord-un izin verdiyi maksimum sürət (200ms)
        const interval = setInterval(async () => {
            if (sentCount >= totalTags) {
                clearInterval(interval);
                activeSpams.delete(message.channel.id);
                return message.channel.send('✅ **Bütün taglar tamamlandı!**');
            }

            // Hər mesajda tagı 5 dəfə təkrarlayır ki, daha tez 1000-ə çatsın
            const multiTag = `${tagType} ${tagType} ${tagType} ${tagType} ${tagType} [${sentCount + 5}/${totalTags}]`;
            sentCount += 5;

            await message.channel.send(multiTag).catch((err) => {
                if (err.status === 429) {
                    console.log("Discord Rate Limitə düşdü, gözlənilir...");
                }
            });

        }, 200); 

        activeSpams.set(message.channel.id, interval);
    }
};