const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'db.json');

function readDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ carLocation: "Bakı", fuel: 100, cleanliness: 100, totalKm: 0, brokenParts: [], users: {} }, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (data.cleanliness === undefined) data.cleanliness = 100;
    if (data.totalKm === undefined) data.totalKm = 0;
    return data;
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

function getUser(userId) {
    const db = readDB();
    if (!db.users[userId]) {
        db.users[userId] = { 
            money: 1000, 
            debt: 0, 
            debtDueDate: null,
            bankName: null,
            interestRate: null 
        };
        writeDB(db);
    }
    if (db.users[userId].debt === undefined) db.users[userId].debt = 0;
    if (db.users[userId].debtDueDate === undefined) db.users[userId].debtDueDate = null;
    if (db.users[userId].bankName === undefined) db.users[userId].bankName = null;
    if (db.users[userId].interestRate === undefined) db.users[userId].interestRate = null;
    return db.users[userId];
}

function updateUserMoney(userId, amount) {
    const db = readDB();
    if (!db.users[userId]) {
        db.users[userId] = { 
            money: 1000, 
            debt: 0, 
            debtDueDate: null,
            bankName: null,
            interestRate: null 
        };
    }
    db.users[userId].money += amount;
    writeDB(db);
    return db.users[userId].money;
}

// Borc vaxtı keçəndə 2 qat cərimə və ya Mute tətbiq edən funksiya
async function checkDebts(message) {
    const db = readDB();
    const userId = message.author.id;
    const user = getUser(userId);

    if (user.debt > 0 && user.debtDueDate && Date.now() > user.debtDueDate) {
        const doubleDebt = user.debt * 2;

        // Əgər balansında 2 qat borcu bağlamağa pul varsa çıxırıq
        if (user.money >= doubleDebt) {
            updateUserMoney(userId, -doubleDebt);
            db.users[userId].debt = 0;
            db.users[userId].debtDueDate = null;
            db.users[userId].bankName = null;
            db.users[userId].interestRate = null;
            writeDB(db);

            await message.channel.send(`🚨 <@${userId}> **KREDİT VAXTI BİTDİ!**\nBorc vaxtında ödənilmədiyi üçün **2 QAT CƏRİMƏ** tətbiq olundu və balansından **${doubleDebt.toFixed(2)} AZN** çıxılaraq borcun sıfırlandı!`);
        } else {
            // Pul çatmadıqda Mute tətbiq olunur (Borcun məbləğinə uyğun dəqiqə: məsələn 100 AZN = 10 dəqiqə)
            const muteMinutes = Math.min(Math.max(Math.ceil(doubleDebt / 10), 5), 1440); // Min 5 dəq, maks 24 saat
            
            db.users[userId].debt = 0; // Cəza çəkildiyi üçün borc sıfırlanır
            db.users[userId].debtDueDate = null;
            db.users[userId].bankName = null;
            db.users[userId].interestRate = null;
            writeDB(db);

            try {
                const member = await message.guild.members.fetch(userId);
                if (member) {
                    await member.timeout(muteMinutes * 60 * 1000, "Bank borcunu vaxtında ödəmədiyi üçün cərimə.");
                }
            } catch (e) {
                console.log("Timeout xətası:", e.message);
            }

            await message.channel.send(`🚨 <@${userId}> **BANK MÜSADİRƏSİ VƏ CƏZA!**\nBorcu ödəyəcək pulun olmadığı üçün **2 qat cərimə (${doubleDebt.toFixed(2)} AZN)** əvəzinə **${muteMinutes} dəqiqə** müddətinə MUTE olundun!`);
        }
    }
}

module.exports = { readDB, writeDB, getUser, updateUserMoney, checkDebts };