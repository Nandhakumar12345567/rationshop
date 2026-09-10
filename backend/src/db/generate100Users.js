const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed100Customers() {
  console.log('[Bulk Seed] Generating 100 Beneficiary Ration Cards...');
  try {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const categories = ['BPL', 'Antyodaya', 'APL'];
    const names = [
      'Anand', 'Bala', 'Chitra', 'Devi', 'Elango', 'Ganesh', 'Hari', 'Indira', 'Jaya', 'Kannan',
      'Lakshmi', 'Mani', 'Nandhini', 'Omprakash', 'Parvathi', 'Rajesh', 'Sangeetha', 'Thenmozhi', 'Uma', 'Venkatesh'
    ];

    const valueRows = [];
    const params = [];

    for (let i = 1; i <= 100; i++) {
      const cardNo = `TN-04-CARD-${String(i).padStart(4, '0')}`;
      const name = `${names[i % names.length]} ${String.fromCharCode(65 + (i % 26))}`;
      const category = categories[i % categories.length];
      const familySize = (i % 4) + 2;
      const phone = `98765${String(i).padStart(5, '0')}`;

      const baseIdx = (i - 1) * 6;
      valueRows.push(`($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6})`);
      params.push(cardNo, name, category, familySize, defaultPasswordHash, phone);
    }

    const queryText = `
      INSERT INTO ration_cards (card_no, holder_name, category, family_size, password_hash, phone)
      VALUES ${valueRows.join(', ')}
      ON CONFLICT (card_no) DO UPDATE SET holder_name = EXCLUDED.holder_name;
    `;

    await db.query(queryText, params);

    console.log('[Bulk Seed] Successfully seeded 100 Beneficiary Accounts into Database!');
    console.log('Generated Card Numbers: TN-04-CARD-0001 to TN-04-CARD-0100 (Password for all: password123)');
  } catch (err) {
    console.error('[Bulk Seed Error]', err);
  }
}

if (require.main === module) {
  seed100Customers().then(() => process.exit(0));
}

module.exports = seed100Customers;
