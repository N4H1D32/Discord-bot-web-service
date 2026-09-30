const { readDB } = require('../db');
const { parts } = require('../partsConfig');

module.exports = {
    name: 'carinfo',
    description: 'Hyundai Accent-in cari halını göstərir',
    prefixRequired: true,
    execute(message, args) {
        const db = readDB();

        let statusText = "✅ Mükəmməl (Problem yoxdur)";
        if (db.brokenParts && db.brokenParts.length > 0) {
            const brokenNames = db.brokenParts.map(p => parts[p] ? parts[p].name : p).join(', ');
            statusText = `💥 QƏZALI (Xarab parçalar: ${brokenNames})`;
        } else if (db.fuel <= 0) {
            statusText = "🚨 YOLDA QALIB (Benzin 0%)";
        }

        // Təmizlik vəziyyəti emojisi
        let cleanStatus = "✨ Təmiz";
        if (db.cleanliness < 40) cleanStatus = "💩 Çox çirkli";
        else if (db.cleanliness < 70) cleanStatus = "🧽 Tozlu";

        const infoMsg = `
🚗 **HYUNDAI ACCENT - STATUS PANELİ** 🚗
──────────────────────────────
📍 **Məkan:** ${db.carLocation}
⛽ **Benzin Səviyyəsi:** %${db.fuel.toFixed(1)}
🧼 **Təmizlik Səviyyəsi:** %${db.cleanliness.toFixed(1)} (${cleanStatus})
🛣️ **Ümumi Qət Olunan Yol:** ${db.totalKm.toFixed(1)} KM
🔧 **Texniki Vəziyyət:** ${statusText}
──────────────────────────────
💡 *Gəzmək üçün \`!sur\`, taksilik üçün \`!taksi\`, təmizlik üçün \`!moyka\` yazın.*
        `;

        return message.reply(infoMsg);
    }
};