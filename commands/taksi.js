const { readDB, writeDB, updateUserMoney } = require('../db');
const { parts } = require('../partsConfig');

// Sifarişçilər üçün təsadüfi adlar və küçə/ünvanlar
const passengerNames = ["Anar m.", "Leyla x.", "Elvin", "Rəşad bəy", "Nərgiz x.", "Murad", "Cavidan", "Günel x."];
const locations = [
    "28 May m/st", "Koroğlu m/st", "Nizami küç.", "Gənclik Mall", 
    "Elmlər Akademiyası", "Nərimanov r-nu", "Badamdar", "Əhmədli", 
    "Ayna Sultanova", "Xətai pr."
];

module.exports = {
    name: 'taksi',
    description: 'Taksi sifarişləri panelini açır və pul qazandırır',
    prefixRequired: true,
    async execute(message, args) {
        const db = readDB();

        // Benzin yoxlaması
        if (db.fuel <= 0) {
            return message.reply('🪫 **Maşının benzini bitib və yolda qalıb!** Taksilik edə bilməzsiniz.\n🚚 Evakuator çağırmaq üçün `!evekuator` yazın!');
        }

        // Xarab parça yoxlaması
        if (db.brokenParts && db.brokenParts.length > 0) {
            const brokenNames = db.brokenParts.map(p => parts[p] ? parts[p].name : p).join(', ');
            return message.reply(`💥 **Maşın xarabdır!** Xarab olan parçalar: **${brokenNames}**.\n⚠️ Xarab maşınla taksilik etmək olmaz! Əvvəlcə \`!sanayi\` yazın.`);
        }

        // Taksilik yalnız Bakıda mümkündür
        if (db.carLocation.toLowerCase() !== "bakı") {
            return message.reply(`📍 Taksilik etmək üçün maşın **Bakı** şəhərində olmalıdır! Hazırda maşın **${db.carLocation}** şəhərindədir. \`!sur\` yazaraq Bakıya qayıdın.`);
        }

        // Təsadüfi 3 sifariş yaradırıq
        const orders = [];
        for (let i = 1; i <= 3; i++) {
            const name = passengerNames[Math.floor(Math.random() * passengerNames.length)];
            const pickup = locations[Math.floor(Math.random() * locations.length)];
            let dropoff = locations[Math.floor(Math.random() * locations.length)];
            
            while (dropoff === pickup) {
                dropoff = locations[Math.floor(Math.random() * locations.length)];
            }

            const dist = (Math.random() * 12 + 3).toFixed(1); // 3 - 15 km arası
            const price = (dist * 1.2 + Math.random() * 5).toFixed(2); // Məsafəyə uyğun qiymət (AZN)
            const fuelCost = (dist * 0.4).toFixed(1); // Şəhəriçi benzin səriyyatı (%)

            orders.push({ 
                id: i, 
                name, 
                pickup, 
                dropoff, 
                dist: parseFloat(dist), 
                price: parseFloat(price), 
                fuelCost: parseFloat(fuelCost) 
            });
        }

        // Paneli göstəririk
        let panelMsg = `🚖 **HYUNDAI ACCENT TAKSİ PANELİ** 🚖\n`;
        panelMsg += `⛽ Cari Benzin: **%${db.fuel.toFixed(1)}**\n\n`;
        panelMsg += `Aşağıdakı müştərilərdən birini seçmək üçün **1**, **2** və ya **3** yazın:\n\n`;

        orders.forEach(o => {
            panelMsg += `**[ Sifariş ${o.id} ]**\n👤 Müştəri: **${o.name}**\n📍 Haradan: *${o.pickup}* ➡️ Haraya: *${o.dropoff}*\n📏 Məsafə: **${o.dist} km** | ⛽ Benzin sərfi: **%${o.fuelCost}**\n💵 Təklif olunan gediş haqqı: **${o.price} AZN**\n───────────────────\n`;
        });

        await message.reply(panelMsg);

        const filter = m => m.author.id === message.author.id && ['1', '2', '3'].includes(m.content.trim());

        try {
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 25000, errors: ['time'] });
            const selectedId = parseInt(collected.first().content.trim());
            const selectedOrder = orders.find(o => o.id === selectedId);

            // Sifariş üçün benzin yoxlaması
            if (db.fuel < selectedOrder.fuelCost) {
                return message.channel.send(`⚠️ **Benzin çatmır!**\nSifariş üçün **%${selectedOrder.fuelCost}** benzin lazımdır, amma sizdə **%${db.fuel.toFixed(1)}** var. \`!benzin\` yazaraq baka benzin vurun.`);
            }

            // Dəyişən: Qət olunan məsafə
            const tripDistance = selectedOrder.dist;

            // Benzini çıxırıq, totalKm və cleanliness göstəricilərini yeniləyirik
            db.fuel -= selectedOrder.fuelCost;
            db.totalKm = (db.totalKm || 0) + tripDistance;
            db.cleanliness = (db.cleanliness || 100) - (tripDistance * 0.05); // Hər km-ə 0.05% kirlənir
            if (db.cleanliness < 0) db.cleanliness = 0;

            // Bazaya yazırıq
            writeDB(db);

            // Balansı yeniləyirik
            const newBalance = updateUserMoney(message.author.id, selectedOrder.price);

            return message.channel.send(`✅ **Müştəri mənzil başına çatdırıldı!**\n👤 Müştəri: **${selectedOrder.name}**\n🛣️ Qət olunan yol: **${selectedOrder.dist} km** (%${selectedOrder.fuelCost} benzin getdi)\n💰 Qazanılan gediş haqqı: **+${selectedOrder.price.toFixed(2)} AZN**\n💵 Yeni Balansın: **${newBalance.toFixed(2)} AZN**\n⛽ Qalan Benzin: **%${db.fuel.toFixed(1)}**`);

        } catch (e) {
            return message.channel.send('⏰ Vaxt bitdi! Sifariş seçilmədiyi üçün taksi paneli bağlandı.');
        }
    }
};