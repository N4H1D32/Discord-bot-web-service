const { readDB, writeDB } = require('../db');
const { parts } = require('../partsConfig');

const distances = {
    "bakı": 0, "qəbələ": 215, "gəncə": 360, "şəki": 300,
    "quba": 170, "lənkəran": 270, "şuşa": 375, "sumqayıt": 30,
    "mingəçevir": 275, "xaçmaz": 190, "şamaxı": 120, "göyçay": 220,
    "qazax": 475
};

module.exports = {
    name: 'sur',
    description: 'Sürüş rejimini başladır',
    prefixRequired: true,
    async execute(message, args) {
        const db = readDB();

        // 1. BENZİN BİTİB YOLDA QALMA YOXLAMASI
        if (db.fuel <= 0) {
            return message.reply('🪫 **Maşının benzini tamamilə bitib və yolda qalıb!**\n🚨 Heç bir yerə gedə bilməzsiniz. Evakuator çağırmaq üçün `!evekuator` yazın!');
        }

        // 2. XARAB PARÇA YOXLAMASI
        if (db.brokenParts && db.brokenParts.length > 0) {
            const brokenNames = db.brokenParts.map(p => parts[p] ? parts[p].name : p).join(', ');
            return message.reply(`💥 **Maşın xarabdır!** Xarab olan parçalar: **${brokenNames}**.\n⚠️ Xarab maşınla yola çıxmaq olmaz! Əvvəlcə \`!sanayi\` yazaraq maşını təmir etdirin.`);
        }

        await message.reply(`🚗 **Hyundai Accent** xodlandı!\n📍 Hazırda maşın: **${db.carLocation}** şəhərindədir.\n⛽ Benzin: **%${db.fuel.toFixed(1)}**\n\n❓ **Haranı gəzmək istəyirsiz?**\n\`Qəbələ, Qazax, Gəncə, Şəki, Quba, Lənkəran, Şuşa, Sumqayıt, Mingəçevir, Xaçmaz, Şamaxı, Göyçay, Bakı\``);

        const filter = m => m.author.id === message.author.id;

        try {
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
            const targetCity = collected.first().content.trim().toLowerCase();

            if (!distances.hasOwnProperty(targetCity)) {
                return message.channel.send('❌ Belə bir rayon siyahıda tapılmadı.');
            }

            const currentCity = db.carLocation.toLowerCase();
            if (targetCity === currentCity) {
                return message.channel.send(`🚘 Maşın zatən **${db.carLocation}** şəhərindədir!`);
            }

            const tripDistance = Math.abs(distances[targetCity] - (distances[currentCity] || 0));
            const requiredFuel = tripDistance * 0.16;

            // 1 km = 5 saniyə gözləmə vaxtı
            const travelTimeSeconds = tripDistance * 5; 

            // Vaxtı daha oxunaqlı göstərmək üçün (Dəqiqə və Saniyə formatında)
            const minutes = Math.floor(travelTimeSeconds / 60);
            const seconds = travelTimeSeconds % 60;
            let timeString = "";
            if (minutes > 0) timeString += `${minutes} dəqiqə `;
            if (seconds > 0 || minutes === 0) timeString += `${seconds} saniyə`;

            // Əgər benzin çatırsa amma yolda sıfırlanacaqsa
            if (db.fuel < requiredFuel) {
                db.fuel = 0; // Benzin yolda bitdi
                writeDB(db);
                return message.channel.send(`🚨 **ÜZÜCÜ XƏBƏR!** **${targetCity.toUpperCase()}** yolunda benzininiz tamamilə bitdi və YOLDA QALDINIZ!\n🚚 Maşını YDM-yə aparmaq üçün \`!evekuator\` çağırın!`);
            }

            const formattedCityName = targetCity.charAt(0).toUpperCase() + targetCity.slice(1);

            // Yola çıxış bildirişi
            await message.channel.send(`🚘 **Hyundai Accent yola çıxdı!**\n📍 **${db.carLocation}** ➡️ **${formattedCityName}**\n🛣️ Məsafə: **${tripDistance} km**\n⏳ Çatma vaxtı: **${timeString}** (1 km = 5 san)\n⛽ Sərf olunacaq benzin: **%${requiredFuel.toFixed(1)}**\n\n*Xahiş olunur yoldaykən gözləyin...*`);

            // Real vaxt simulyasiyası (Gözləmə kodu)
            setTimeout(async () => {
                const currentDb = readDB(); // Yenidən DB oxuyuruq

                // Qəza Ehtimalı (%15)
                const isAccident = Math.random() < 0.15;
                if (isAccident) {
                    const partKeys = Object.keys(parts);
                    const randomPartKey = partKeys[Math.floor(Math.random() * partKeys.length)];
                    const brokenPart = parts[randomPartKey];

                    currentDb.brokenParts.push(randomPartKey);
                    currentDb.fuel -= requiredFuel / 2;
                    if (currentDb.fuel < 0) currentDb.fuel = 0;
                    writeDB(currentDb);

                    try {
                        const member = await message.guild.members.fetch(brokenPart.userId);
                        if (member) {
                            await member.voice.setMute(true, "Hyundai Accent hissəsi xarab oldu!").catch(() => {});
                            await member.timeout(10 * 60 * 1000, "Hyundai Accent hissəsi xarab oldu!").catch(() => {});
                        }
                    } catch (err) {}

                    return message.channel.send(`💥 **BƏDSƏS QƏZA!** Yolda gedərkən **${brokenPart.name}** sıradan çıxdı!\n🛠️ <@${brokenPart.userId}> xarab olduğu üçün səs/chat sistemi bloklandı!\n🔧 Təmir etmək üçün: \`!sanayi\` yazın!`);
                }

                // Normal Yolculuq Tamamlanması
                currentDb.fuel -= requiredFuel;
                if (currentDb.fuel < 0) currentDb.fuel = 0;

                currentDb.carLocation = formattedCityName;
                currentDb.totalKm = (currentDb.totalKm || 0) + tripDistance;
                currentDb.cleanliness = (currentDb.cleanliness || 100) - (tripDistance * 0.05);
                if (currentDb.cleanliness < 0) currentDb.cleanliness = 0;

                writeDB(currentDb);

                return message.channel.send(`🏁 **Yolculuq tamamlandı!**\n🛣️ Qət olunan məsafə: **${tripDistance} km**\n📍 Yeni məkan: **${formattedCityName}**\n⛽ Qalan Benzin: **%${currentDb.fuel.toFixed(1)}**\n🧼 Təmizlik: **%${currentDb.cleanliness.toFixed(1)}**`);

            }, travelTimeSeconds * 1000);

        } catch (e) {
            return message.channel.send('⏰ Vaxt bitdi! Məkan yazılmadığı üçün sürüş ləğv olundu.');
        }
    }
};