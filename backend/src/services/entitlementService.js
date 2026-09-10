/**
 * Entitlement Service for Tamil Nadu Smart PDS (TNPDS) & NFSA member-scaled commodity allocations
 */

/**
 * Calculate member-scaled entitlement according to TNPDS & NFSA standards
 * @param {string} itemId - e.g. 'ITEM-RICE', 'ITEM-WHEAT', etc.
 * @param {string} category - 'BPL', 'Antyodaya', 'APL'
 * @param {number} familySize - Number of family members registered on card
 */
function calculateItemEntitlement(itemId, category = 'BPL', familySize = 1) {
  const members = Math.max(1, parseInt(familySize, 10) || 1);
  const cat = (category || 'BPL').toUpperCase();

  let quota = 0;
  let perMemberRate = '';
  let perMemberRateTa = '';
  let formulaText = '';
  let formulaTextTa = '';

  switch (itemId) {
    case 'ITEM-RICE':
      if (cat.includes('ANTYODAYA') || cat === 'AAY') {
        quota = 35; // Antyodaya fixed 35 kg per card in TN
        perMemberRate = '35 kg / Card';
        perMemberRateTa = '35 கிகி / அட்டை';
        formulaText = 'Fixed Antyodaya Allocation = 35 kg';
        formulaTextTa = 'அந்தியோதயா நிர்ணயிக்கப்பட்ட ஒதுக்கீடு = 35 கிகி';
      } else if (cat.includes('APL') || cat.includes('NPHH')) {
        quota = Math.max(10, members * 3); // 3 kg per member, min 10 kg
        perMemberRate = '3 kg / Member';
        perMemberRateTa = '3 கிகி / நபர்';
        formulaText = `3 kg × ${members} Members = ${quota} kg`;
        formulaTextTa = `3 கிகி × ${members} நபர்கள் = ${quota} கிகி`;
      } else {
        // BPL / PHH: 5 kg per member (NFSA standard, min 12 kg for 1 adult in TN)
        quota = members === 1 ? 12 : members * 5;
        perMemberRate = '5 kg / Member';
        perMemberRateTa = '5 கிகி / நபர்';
        formulaText = members === 1 ? 'Single Member Minimum = 12 kg' : `5 kg × ${members} Members = ${quota} kg`;
        formulaTextTa = members === 1 ? 'ஒற்றை நபர் குறைந்தபட்சம் = 12 கிகி' : `5 கிகி × ${members} நபர்கள் = ${quota} கிகி`;
      }
      break;

    case 'ITEM-WHEAT':
      if (cat.includes('ANTYODAYA') || cat === 'AAY') {
        quota = members * 3;
        perMemberRate = '3 kg / Member';
        perMemberRateTa = '3 கிகி / நபர்';
        formulaText = `3 kg × ${members} Members = ${quota} kg`;
        formulaTextTa = `3 கிகி × ${members} நபர்கள் = ${quota} கிகி`;
      } else if (cat.includes('APL') || cat.includes('NPHH')) {
        quota = Math.max(5, Math.round(members * 1.5));
        perMemberRate = '1.5 kg / Member';
        perMemberRateTa = '1.5 கிகி / நபர்';
        formulaText = `1.5 kg × ${members} Members = ${quota} kg`;
        formulaTextTa = `1.5 கிகி × ${members} நபர்கள் = ${quota} கிகி`;
      } else {
        // BPL: 2.5 kg per member (e.g. 4 members = 10 kg)
        quota = Math.round(members * 2.5);
        perMemberRate = '2.5 kg / Member';
        perMemberRateTa = '2.5 கிகி / நபர்';
        formulaText = `2.5 kg × ${members} Members = ${quota} kg`;
        formulaTextTa = `2.5 கிகி × ${members} நபர்கள் = ${quota} கிகி`;
      }
      break;

    case 'ITEM-SUGAR':
      // 500 grams (0.5 kg) per member per month, min 1 kg
      if (cat.includes('ANTYODAYA') || cat === 'AAY') {
        quota = Math.max(2, Math.round(members * 0.5 + 0.5));
        perMemberRate = '500g / Member';
        perMemberRateTa = '500கி / நபர்';
        formulaText = `500g × ${members} Members = ${quota} kg`;
        formulaTextTa = `500கி × ${members} நபர்கள் = ${quota} கிகி`;
      } else if (cat.includes('APL') || cat.includes('NPHH')) {
        quota = Math.max(1, Math.round(members * 0.5));
        perMemberRate = '500g / Member';
        perMemberRateTa = '500கி / நபர்';
        formulaText = `500g × ${members} Members = ${quota} kg`;
        formulaTextTa = `500கி × ${members} நபர்கள் = ${quota} கிகி`;
      } else {
        // BPL: 0.5 kg per head
        const rawQuota = members * 0.5;
        quota = Math.max(1, parseFloat(rawQuota.toFixed(1)));
        perMemberRate = '500g / Member';
        perMemberRateTa = '500கி / நபர்';
        formulaText = `500g × ${members} Members = ${quota} kg`;
        formulaTextTa = `500கி × ${members} நபர்கள் = ${quota} கிகி`;
      }
      break;

    case 'ITEM-DAL':
      // 1 kg base, 2 kg if family_size >= 4 or Antyodaya
      if (members >= 4 || cat.includes('ANTYODAYA') || cat === 'AAY') {
        quota = 2;
        perMemberRate = '2 kg (Family ≥ 4)';
        perMemberRateTa = '2 கிகி (குடும்பம் ≥ 4)';
        formulaText = `Large Family (≥4 members) = 2 kg`;
        formulaTextTa = `பெரிய குடும்பம் (≥4 நபர்கள்) = 2 கிகி`;
      } else {
        quota = 1;
        perMemberRate = '1 kg / Card';
        perMemberRateTa = '1 கிகி / அட்டை';
        formulaText = `Standard Allocation = 1 kg`;
        formulaTextTa = `நிலையான ஒதுக்கீடு = 1 கிகி`;
      }
      break;

    case 'ITEM-OIL':
      // 1 L base, 2 L if family_size >= 5 or Antyodaya
      if (members >= 5 || cat.includes('ANTYODAYA') || cat === 'AAY') {
        quota = 2;
        perMemberRate = '2 Litres (Family ≥ 5)';
        perMemberRateTa = '2 லிட்டர் (குடும்பம் ≥ 5)';
        formulaText = `Large Family (≥5 members) = 2 Litres`;
        formulaTextTa = `பெரிய குடும்பம் (≥5 நபர்கள்) = 2 லிட்டர்`;
      } else {
        quota = 1;
        perMemberRate = '1 Litre / Card';
        perMemberRateTa = '1 லிட்டர் / அட்டை';
        formulaText = `Standard Allocation = 1 Litre`;
        formulaTextTa = `நிலையான ஒதுக்கீடு = 1 லிட்டர்`;
      }
      break;

    case 'ITEM-KEROSENE':
      if (cat.includes('ANTYODAYA') || cat === 'AAY') {
        quota = 5;
        perMemberRate = '5 Litres / Card';
        perMemberRateTa = '5 லிட்டர் / அட்டை';
        formulaText = 'Antyodaya LPG connectivity quota = 5 L';
        formulaTextTa = 'அந்தியோதயா ஒதுக்கீடு = 5 லிட்டர்';
      } else if (cat.includes('BPL')) {
        quota = 3;
        perMemberRate = '3 Litres / Card';
        perMemberRateTa = '3 லிட்டர் / அட்டை';
        formulaText = 'BPL single cylinder quota = 3 L';
        formulaTextTa = 'BPL சிலிண்டர் ஒதுக்கீடு = 3 லிட்டர்';
      } else {
        quota = 0;
        perMemberRate = '0 L (2 Cylinders)';
        perMemberRateTa = '0 லிட்டர்';
        formulaText = 'Not eligible (Double cylinder connection)';
        formulaTextTa = 'தகுதி இல்லை (2 சிலிண்டர்கள்)';
      }
      break;

    default:
      quota = 1;
      perMemberRate = '1 unit';
      perMemberRateTa = '1 அளவு';
      formulaText = 'Standard allocation';
      formulaTextTa = 'நிலையான ஒதுக்கீடு';
  }

  return {
    quota,
    perMemberRate,
    perMemberRateTa,
    formulaText,
    formulaTextTa,
    familySize: members
  };
}

module.exports = {
  calculateItemEntitlement
};
