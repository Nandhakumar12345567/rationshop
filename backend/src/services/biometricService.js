/**
 * Pluggable Biometric Service Interface
 * 
 * Simulated Aadhaar L1 Registered Device (RD) Fingerprint verification module.
 * Designed as a pluggable interface to easily swap mock simulation with a live
 * Aadhaar biometric SDK (e.g., Mantra / Morpho / Startek RD Service API).
 */

class BiometricService {
  /**
   * Verify fingerprint against Ration Card holder records
   * @param {string} cardNo - Ration Card Number
   * @param {object} biometricSampleData - Captured minutiae / PID data
   * @param {boolean} forceFail - Optional flag to test biometric mismatch
   */
  static async verifyFingerprint(cardNo, biometricSampleData = {}, forceFail = false) {
    // Simulate biometric match processing delay (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (forceFail) {
      return {
        success: false,
        matchScore: 42.10,
        threshold: 75.00,
        message: 'Biometric verification failed: Fingerprint minutiae score below threshold.',
        timestamp: new Date().toISOString()
      };
    }

    // Mock successful match
    const matchScore = parseFloat((95.0 + Math.random() * 4.9).toFixed(2));
    return {
      success: true,
      matchScore,
      threshold: 75.00,
      verifiedBy: 'Aadhaar_Mock_RD_Service_v2',
      deviceSerial: 'MANTRA_MFS100_MOCK_8829',
      message: 'Biometric verification successful. Identity verified.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BiometricService;
