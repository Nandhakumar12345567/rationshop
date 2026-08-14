# 🌾 Smart Ration — Digital Booking, Token & Queue Management System

Smart Ration is a full-stack digital ration booking, QR token generation, and biometric queue management system built for Fair Price Shops (FPS) under the Public Distribution System (PDS).

It enables ration card beneficiaries to view monthly entitlements, book time slots, pay nominal subsidised rates via Razorpay UPI, and receive a secure QR token code. Shopkeepers scan the QR code, verify customer identity via pluggable fingerprint biometrics, and issue items in real-time — completely eliminating long physical queue wait times.

---

## 🌟 Key Features

- **Customer App**:
  - **Auth**: Login via Ration Card Number + Password with instant OTP fallback.
  - **Entitlement Engine**: Automatic monthly entitlement capping based on card category (**APL**, **BPL**, **Antyodaya / AAY**).
  - **Real-Time Slot Booking**: Live hourly capacity checker (max 10 beneficiaries per time window) preventing overcrowding.
  - **Razorpay UPI Checkout**: Integrated test payment order and signature verification.
  - **Digital QR Token**: Cryptographically signed JWT token embedding card info, items, and slot time.
  - **Multi-Lingual UI**: One-tap toggle between **English** and **Tamil (தமிழ்)**.
  
- **Shopkeeper Terminal**:
  - **QR Code Scanner**: Decodes token string and auto-fetches beneficiary details and item breakdown.
  - **Pluggable Biometric Verification**: Simulated fingerprint minutiae matching score engine ready for Aadhaar L1 RD Service SDK swap-in.
  - **Instant Stock Auto-Deduction**: Deducts issued items from FPS shop inventory and locks token against reuse.

- **Admin Panel**:
  - District analytics dashboard tracking total beneficiaries, daily distribution volume, and revenue collected.
  - Low stock inventory alerts and fraud audit logs.

---

## 🏗️ Tech Stack

- **Frontend (Mobile App)**: React Native (Expo), React Native Web, Context API, Vanilla CSS / StyleSheet
- **Backend (REST API)**: Node.js, Express.js, JWT, bcryptjs, QRCode
- **Database**: PostgreSQL (`pg`) with automatic SQLite fallback (`sqlite3`) for instant zero-config local execution
- **Payments**: Razorpay UPI sandbox integration
- **Notifications**: Firebase Cloud Messaging (FCM) push service

---

## 📁 Repository Structure

```
ration shop/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js (PostgreSQL pool + SQLite fallback)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── itemController.js
│   │   │   ├── bookingController.js
│   │   │   ├── paymentController.js
│   │   │   ├── issueController.js
│   │   │   └── adminController.js
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   ├── seed.sql
│   │   │   └── initDb.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── items.js
│   │   │   ├── bookings.js
│   │   │   ├── payments.js
│   │   │   ├── issue.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── biometricService.js (Pluggable Aadhaar RD SDK mock)
│   │   │   ├── qrService.js
│   │   │   └── notificationService.js
│   │   └── app.js
│   ├── tests/
│   │   ├── booking.test.js
│   │   └── payment.test.js
│   ├── server.js
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── BiometricModal.js
│   │   │   ├── RazorpayModal.js
│   │   │   └── QRModal.js
│   │   ├── i18n/
│   │   │   └── strings.js (English & Tamil)
│   │   ├── screens/
│   │   │   ├── auth/LoginScreen.js
│   │   │   ├── customer/CustomerView.js
│   │   │   ├── shopkeeper/ShopkeeperView.js
│   │   │   └── admin/AdminView.js
│   │   └── theme/
│   │       └── colors.js
│   ├── App.js
│   └── package.json
└── README.md
```

---

## 👆 Pluggable Biometric Module (Aadhaar RD Service Placeholder)

Because production Aadhaar Registered Device (RD) SDKs require UIDAI government accreditation and physical USB fingerprint sensor hardware (e.g. Mantra MFS100, Morpho MSO1300), the biometric verification module is architected as a pluggable service:

```javascript
// backend/src/services/biometricService.js
class BiometricService {
  static async verifyFingerprint(cardNo, biometricSampleData = {}, forceFail = false) {
    // To swap with production Aadhaar RD Service:
    // const rdResponse = await axios.post('http://localhost:8035/rd/capture', pidXmlPayload);
    // return parseAadhaarAuthRes(rdResponse.data);

    const matchScore = parseFloat((95.0 + Math.random() * 4.9).toFixed(2));
    return {
      success: true,
      matchScore,
      threshold: 75.00,
      verifiedBy: 'Aadhaar_Mock_RD_Service_v2'
    };
  }
}
```

---

## ⚡ Quick Start & Running Locally

### 1. Start Express REST Backend

```bash
cd backend
npm install
npm run seed     # Initializes schema and populates sample seed data
npm start        # Starts server on http://localhost:5000
```

### 2. Run Jest Automated Unit Tests

```bash
cd backend
npm test
```

### 3. Launch Mobile App (Web & Mobile)

```bash
cd mobile
npm install
npm run web      # Starts Expo web preview on http://localhost:8081
```

---

## 🧪 Pre-configured Seed Credentials

| Role | Ration Card No / ID | Password | Notes |
| :--- | :--- | :--- | :--- |
| **BPL Beneficiary** | `TN-04-BPL-883921` | `password123` | Rice: 20kg limit, Wheat: 10kg limit |
| **Antyodaya (AAY)** | `TN-04-AAY-109283` | `password123` | Rice: 35kg limit, Sugar: 3kg limit |
| **APL Beneficiary** | `TN-04-APL-549102` | `password123` | Rice: 10kg limit |
| **Shopkeeper Staff** | `SHOP-STAFF-001` | `password123` | Staff terminal view |
| **District Admin** | `ADMIN-001` | `password123` | District analytics view |

*Note: For OTP login testing, use OTP code `123456`.*

---

## 📡 REST API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Login via Card No + Password |
| `/api/auth/send-otp` | `POST` | Public | Send 6-digit OTP fallback |
| `/api/auth/verify-otp` | `POST` | Public | Verify OTP code & return JWT |
| `/api/items` | `GET` | User | Get items with category limits |
| `/api/bookings/slots` | `GET` | User | Get time slots & occupancy |
| `/api/bookings/create` | `POST` | User | Create slot booking & QR payload |
| `/api/payments/create-order`| `POST` | User | Create Razorpay test order |
| `/api/payments/verify` | `POST` | User | Verify UPI transaction |
| `/api/issue/scan-qr` | `POST` | Staff | Scan QR token code |
| `/api/issue/verify-biometric`| `POST` | Staff | Run biometric fingerprint match |
| `/api/issue/complete` | `POST` | Staff | Issue items & auto-deduct stock |
| `/api/admin/analytics` | `GET` | Admin | Get district stats & low stock alerts |
