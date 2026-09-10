/**
 * Family Members Utility for Tamil Nadu Smart Ration Cards
 */

const CARD_FAMILY_POOLS = {
  'TN-04-AAY-109283': [
    { sl: 1, id: 1, name: 'Priya Sundaram', nameTa: 'பிரியா சுந்தரம்', relation: 'Head / குடும்பத் தலைவர்', age: 45, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-4912' },
    { sl: 2, id: 2, name: 'Sundaram V', nameTa: 'சுந்தரம் வி', relation: 'Husband / கணவர்', age: 48, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-8821' },
    { sl: 3, id: 3, name: 'Kaviya Sundaram', nameTa: 'காவியா சுந்தரம்', relation: 'Daughter / மகள்', age: 19, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-3301' },
    { sl: 4, id: 4, name: 'Arjun Sundaram', nameTa: 'அர்ஜுன் சுந்தரம்', relation: 'Son / மகன்', age: 14, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-7164' },
    { sl: 5, id: 5, name: 'Lakshmi Ammal', nameTa: 'லட்சுமி அம்மாள்', relation: 'Mother-in-law / மாமியார்', age: 72, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-9943' },
    { sl: 6, id: 6, name: 'Natarajan V', nameTa: 'நடராஜன் வி', relation: 'Father-in-law / மாமனார்', age: 76, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-1102' },
    { sl: 7, id: 7, name: 'Meera Sundaram', nameTa: 'மீரா சுந்தரம்', relation: 'Daughter / மகள்', age: 10, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-4521' },
    { sl: 8, id: 8, name: 'Saravanan S', nameTa: 'சரவணன் எஸ்', relation: 'Brother / சகோதரர்', age: 38, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-8890' }
  ],
  'TN-04-APL-549102': [
    { sl: 1, id: 1, name: 'Karthik Subramanian', nameTa: 'கார்த்திக் சுப்பிரமணியன்', relation: 'Head / குடும்பத் தலைவர்', age: 35, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-2194' },
    { sl: 2, id: 2, name: 'Divya Subramanian', nameTa: 'திவ்யா சுப்பிரமணியன்', relation: 'Wife / மனைவி', age: 32, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-6510' },
    { sl: 3, id: 3, name: 'Aarav Karthik', nameTa: 'ஆரவ் கார்த்திக்', relation: 'Son / மகன்', age: 6, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-8041' },
    { sl: 4, id: 4, name: 'Diya Karthik', nameTa: 'தியா கார்த்திக்', relation: 'Daughter / மகள்', age: 3, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-5512' },
    { sl: 5, id: 5, name: 'Subramanian S', nameTa: 'சுப்பிரமணியன் எஸ்', relation: 'Father / தந்தை', age: 66, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-9011' },
    { sl: 6, id: 6, name: 'Kalyani S', nameTa: 'கல்யாணி எஸ்', relation: 'Mother / தாய்', age: 62, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-3344' },
    { sl: 7, id: 7, name: 'Vignesh Subramanian', nameTa: 'விக்னேஷ்', relation: 'Brother / தம்பி', age: 28, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-6621' },
    { sl: 8, id: 8, name: 'Pooja Vignesh', nameTa: 'பூஜா', relation: 'Sister-in-law', age: 26, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-7788' }
  ],
  'DEFAULT': [
    { sl: 1, id: 1, name: 'Ramesh Kumar', nameTa: 'ரமேஷ் குமார்', relation: 'Head / குடும்பத் தலைவர்', age: 42, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-1934' },
    { sl: 2, id: 2, name: 'Sunita Kumar', nameTa: 'சுனிதா குமார்', relation: 'Wife / மனைவி', age: 38, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-5529' },
    { sl: 3, id: 3, name: 'Rahul Kumar', nameTa: 'ராகுல் குமார்', relation: 'Son / மகன்', age: 16, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-4188' },
    { sl: 4, id: 4, name: 'Ananya Kumar', nameTa: 'அனன்யா குமார்', relation: 'Daughter / மகள்', age: 12, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-9023' },
    { sl: 5, id: 5, name: 'Lakshmi Ammal', nameTa: 'லட்சுமி அம்மாள்', relation: 'Mother / தாய்', age: 68, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-7123' },
    { sl: 6, id: 6, name: 'Subramanian K', nameTa: 'சுப்பிரமணியன் கே', relation: 'Father / தந்தை', age: 72, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-8822' },
    { sl: 7, id: 7, name: 'Meenakshi Kumar', nameTa: 'மீனாட்சி குமார்', relation: 'Grandmother / பாட்டி', age: 88, gender: 'F / பெண்', aadhaar: 'XXXX-XXXX-3399' },
    { sl: 8, id: 8, name: 'Vijay Kumar', nameTa: 'விஜய் குமார்', relation: 'Brother / சகோதரர்', age: 32, gender: 'M / ஆண்', aadhaar: 'XXXX-XXXX-6611' }
  ]
};

export function getFamilyMembersForCount(user, count = 4) {
  const cardNo = user?.card_no || '';
  const pool = CARD_FAMILY_POOLS[cardNo] || CARD_FAMILY_POOLS['DEFAULT'];
  const targetCount = Math.max(1, Math.min(10, parseInt(count, 10) || 4));

  const result = [];
  for (let i = 0; i < targetCount; i++) {
    if (i < pool.length) {
      result.push({ ...pool[i], sl: i + 1, id: pool[i].id || (i + 1) });
    } else {
      const idx = i + 1;
      result.push({
        sl: idx,
        id: idx,
        name: `Member ${idx}`,
        nameTa: `உறுப்பினர் ${idx}`,
        relation: 'Dependent / சார்ந்திருப்பவர்',
        age: 20 + (idx * 3),
        gender: idx % 2 === 0 ? 'F / பெண்' : 'M / ஆண்',
        aadhaar: `XXXX-XXXX-${3000 + idx}`
      });
    }
  }

  return result;
}

export function getCardDefaultFamilyMembers(user) {
  const defaultSize = user?.family_size ? parseInt(user.family_size, 10) : 4;
  return getFamilyMembersForCount(user, defaultSize);
}
