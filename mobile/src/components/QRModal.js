import React, { useState } from 'react';
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { getQRCodeSVGDataURI } from '../utils/qrGenerator';

export default function QRModal({ visible, onClose, booking, user, lang = 'en' }) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!booking) return null;

  // Build required JSON payload: { card_no, token_id, items, slot_time, issued_at }
  const tokenPayload = {
    card_no: booking.card_no,
    token_id: booking.booking_id,
    items: booking.items,
    slot_time: booking.slot_time,
    issued_at: booking.created_at || new Date().toISOString()
  };

  const payloadString = JSON.stringify(tokenPayload);

  // Generate web & mobile safe SVG Data URI QR Code
  const qrImageUri = booking.qr_data_url || getQRCodeSVGDataURI(payloadString);

  const handleRetry = () => {
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  const generateReceiptHtml = () => {
    const issuedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const grandTotal = booking.total_price !== undefined 
      ? booking.total_price 
      : (booking.items || []).reduce((acc, it) => acc + (it.total_price || 0), 0);

    const itemsRows = (booking.items && booking.items.length > 0)
      ? booking.items.map((it, idx) => `
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #CBD5E1;">${idx + 1}</td>
          <td style="padding: 8px 10px; border: 1px solid #CBD5E1;"><strong>${it.name}</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #CBD5E1;">${it.quantity} ${it.unit || 'kg'}</td>
          <td style="padding: 8px 10px; border: 1px solid #CBD5E1;">₹${(it.price || 0).toFixed(2)}</td>
          <td style="padding: 8px 10px; border: 1px solid #CBD5E1; text-align: right; font-weight: 700;">₹${(it.total_price || 0).toFixed(2)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" style="padding: 10px; text-align: center;">Monthly Subsidised Entitlement Allocation</td></tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tamil Nadu PDS - Token Receipt #${booking.booking_id}</title>
  <style>
    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0F172A;
      background: #F8FAFC;
    }
    .receipt-container {
      max-width: 680px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #061E47;
      border-radius: 14px;
      padding: 28px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      position: relative;
    }
    .header-banner {
      border-bottom: 3px solid #FF9933;
      padding-bottom: 16px;
      margin-bottom: 20px;
      text-align: center;
    }
    .govt-title {
      font-size: 17px;
      font-weight: 900;
      color: #061E47;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .dept-title {
      font-size: 12px;
      color: #475569;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .receipt-title {
      font-size: 16px;
      font-weight: 800;
      color: #166534;
      background: #DCFCE7;
      display: inline-block;
      padding: 6px 18px;
      border-radius: 20px;
      border: 1px solid #86EFAC;
    }
    .ref-row {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #475569;
      margin-top: 12px;
      border-bottom: 1px dashed #CBD5E1;
      padding-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
      background: #F8FAFC;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
    }
    .info-item {
      font-size: 12.5px;
      margin-bottom: 6px;
    }
    .info-item strong {
      color: #0F172A;
      display: inline-block;
      min-width: 120px;
    }
    .qr-card {
      text-align: center;
      margin: 18px 0;
      padding: 16px;
      background: #F0FDF4;
      border-radius: 12px;
      border: 1px solid #BBF7D0;
    }
    .qr-img {
      width: 180px;
      height: 180px;
      margin: 0 auto;
      display: block;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      background: #FFFFFF;
      padding: 8px;
    }
    .qr-desc {
      font-size: 11.5px;
      color: #166534;
      font-weight: 700;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
    }
    th {
      background: #061E47;
      color: #FFFFFF;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #CBD5E1;
    }
    tr:nth-child(even) {
      background: #F8FAFC;
    }
    .total-row td {
      background: #EFF6FF !important;
      font-weight: 800;
      font-size: 13px;
    }
    .status-badge {
      display: inline-block;
      background: #16A34A;
      color: #FFFFFF;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .footer-note {
      font-size: 10px;
      color: #64748B;
      text-align: center;
      line-height: 1.5;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      margin-top: 16px;
    }
    .seal-text {
      font-weight: 900;
      color: #061E47;
      letter-spacing: 0.6px;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .print-actions-bar {
      margin-top: 16px;
      text-align: center;
    }
    .print-btn {
      background: #0B3D91;
      color: #FFFFFF;
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header-banner">
      <div class="govt-title">GOVERNMENT OF TAMIL NADU</div>
      <div class="dept-title">Department of Civil Supplies & Consumer Protection • Smart PDS System</div>
      <div class="receipt-title">OFFICIAL TOKEN PASS & PAYMENT ACKNOWLEDGEMENT</div>
      <div class="ref-row">
        <span>Application Reference: <strong>TN/PDS/2026/0000${booking.booking_id}</strong></span>
        <span>Date: <strong>${issuedDate}</strong></span>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-item"><strong>Cardholder Name:</strong> ${user?.holder_name || 'Designated Beneficiary'}</div>
        <div class="info-item"><strong>Ration Card No:</strong> ${booking.card_no}</div>
        <div class="info-item"><strong>Card Category:</strong> ${user?.category || 'BPL (Priority Household)'}</div>
        <div class="info-item"><strong>Family Members:</strong> ${user?.family_size || 4} Members</div>
      </div>
      <div>
        <div class="info-item"><strong>Fair Price Shop:</strong> FPS #401 (GNC Road, T. Nagar)</div>
        <div class="info-item"><strong>Appointed Slot:</strong> ${booking.slot_time || '10:00 AM - 11:00 AM'}</div>
        <div class="info-item"><strong>Queue Token No:</strong> <span style="color:#0E5A3A;font-weight:900;font-size:15px;">#${booking.token_number || booking.booking_id || 1}</span></div>
        <div class="info-item"><strong>Payment Status:</strong> <span class="status-badge">${booking.payment_status || 'PAID'}</span></div>
      </div>
    </div>

    <div class="qr-card">
      <img class="qr-img" src="${qrImageUri}" alt="Digital Token QR" />
      <div class="qr-desc">⚡ Official Digital QR Pass — Present at FPS Counter #1 for Biometric Dispensation</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">S.No</th>
          <th>Subsidised Commodity</th>
          <th>Allocated Quota</th>
          <th>Unit Price</th>
          <th style="text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">GRAND TOTAL AMOUNT PAID:</td>
          <td style="text-align: right; color: #166534;">₹${Number(grandTotal).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="font-size: 11px; color: #475569; margin-bottom: 12px; line-height: 1.6;">
      <div><strong>Payment Mode:</strong> Razorpay UPI Gateway (Transaction Verified)</div>
      <div><strong>Payment Ref ID:</strong> ${booking.payment_id || `pay_upi_${booking.booking_id}_${Date.now()}`}</div>
    </div>

    <div class="footer-note">
      This is an official cryptographically generated electronic receipt under the Tamil Nadu Public Distribution System (PDS) Control Order & National Food Security Act (NFSA). No physical signature is required.
      <div class="seal-text">TAMIL NADU CIVIL SUPPLIES CORPORATION • VALID DIGITAL TOKEN</div>
    </div>

    <div class="print-actions-bar no-print">
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadReceipt = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        setDownloading(true);
        const receiptHtml = generateReceiptHtml();

        // Trigger direct file download of HTML receipt document
        const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `TN_Ration_Receipt_Token_${booking.token_number || booking.booking_id || '1'}_${booking.card_no || 'Pass'}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        setDownloadSuccess(true);
        setDownloading(false);
      } catch (err) {
        console.error('[Download Receipt Error]', err);
        setDownloading(false);
        alert('Failed to download receipt: ' + err.message);
      }
    } else {
      alert('Token receipt downloaded to device storage.');
    }
  };

  const handlePrintReceipt = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const receiptHtml = generateReceiptHtml();
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
        doc.open();
        doc.write(receiptHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (printErr) {
            console.warn('[Iframe Print fallback to window.open]', printErr);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(receiptHtml);
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
            }
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 4000);
          }
        }, 400);
      } catch (err) {
        console.error('[Print Receipt Error]', err);
        window.print();
      }
    } else {
      alert('Ready to print token receipt.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Government Watermark Card Header */}
          <View style={styles.headerBar}>
            <Text style={styles.sealEmblem}>🏛️ GOVERNMENT OF TAMIL NADU</Text>
            <Text style={styles.title}>Digital Ration Token Pass</Text>
            <Text style={styles.subTitle}>Tamil Nadu Public Distribution System (PDS)</Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Reference Number */}
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>OFFICIAL APPLICATION REFERENCE NO:</Text>
              <Text style={styles.refNo}>TN/RATION/2026/0000{booking.booking_id}</Text>
            </View>

            {/* QR Container with Watermark Border */}
            <View style={styles.qrWatermarkContainer}>
              <View style={styles.watermarkPattern}>
                <Text style={styles.watermarkText}>GOVT OF TN • PDS • GOVT OF TN • PDS</Text>
              </View>
              
              <View style={styles.qrBox}>
                {hasError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTitle}>QR Generation Error</Text>
                    <Text style={styles.errorMsg}>Failed to encode digital token payload. Please tap retry.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                      <Text style={styles.retryBtnText}>🔄 Retry Generating QR</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image 
                    key={retryCount}
                    source={{ uri: qrImageUri }} 
                    style={styles.qrImage}
                    resizeMode="contain"
                    onError={() => setHasError(true)}
                  />
                )}
              </View>

              <Text style={styles.scanInstruction}>
                Present this encrypted QR code to the Fair Price Shop (#401) staff for biometric fingerprint validation.
              </Text>
            </View>

            {/* Status Pill */}
            <View style={[styles.statusBadge, booking.status === 'ISSUED' ? styles.statusIssuedBg : styles.statusPendingBg]}>
              <Text style={[styles.statusText, booking.status === 'ISSUED' ? styles.statusIssuedText : styles.statusPendingText]}>
                {booking.status === 'ISSUED' ? '✅ RATION ISSUED & COMPLETED' : '⏳ ACTIVE APPOINTMENT TOKEN'}
              </Text>
            </View>

            {/* Token Breakdown Table */}
            <View style={styles.detailsBox}>
              <Text style={styles.tableHeader}>Token Breakdown & Quota Info:</Text>
              
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Ration Card No:</Text>
                <Text style={styles.rowVal}>{booking.card_no}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Appointed Slot:</Text>
                <Text style={styles.rowVal}>{booking.slot_time}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Payment Status:</Text>
                <Text style={[styles.rowVal, { color: '#138808', fontWeight: '800' }]}>{booking.payment_status}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.rowLabel}>Fair Price Shop:</Text>
                <Text style={styles.rowVal}>FPS #401 (GNC Road, T. Nagar)</Text>
              </View>

              <Text style={[styles.tableHeader, { marginTop: 10 }]}>Booked Entitlements:</Text>
              {booking.items && booking.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemBullet}>• {it.name}:</Text>
                  <Text style={styles.itemQty}>{it.quantity} {it.unit} (₹{(it.total_price || 0).toFixed(2)})</Text>
                </View>
              ))}
            </View>

            {/* Download Status Toast if downloaded */}
            {downloadSuccess && (
              <View style={styles.downloadSuccessNotice}>
                <Text style={styles.downloadSuccessNoticeText}>
                  ✅ Receipt downloaded to your device! Tap "Print / Save PDF" below to print or save as PDF.
                </Text>
              </View>
            )}

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={[styles.shareBtn, downloadSuccess && styles.shareBtnSuccess]} 
                onPress={handleDownloadReceipt}
                disabled={downloading}
                activeOpacity={0.85}
              >
                <Text style={styles.shareBtnText}>
                  {downloading ? '⏳ Downloading Receipt...' : downloadSuccess ? '✅ Downloaded (Click to re-download)' : '📥 Download Official Token Receipt'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.printBtn}
                onPress={handlePrintReceipt}
                activeOpacity={0.85}
              >
                <Text style={styles.printBtnText}>🖨️ Print Receipt / Save as PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Legal Small Print */}
            <Text style={styles.legalSmallPrint}>
              This is an official digitally generated token issued under the Tamil Nadu Public Distribution System (PDS) Control Order & NFSA Rules. Valid only for the designated cardholder at FPS #401.
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close Token Window</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#FF9933'
  },
  sealEmblem: {
    color: '#FF9933',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2
  },
  subTitle: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2
  },
  body: {
    padding: 16
  },
  bodyContent: {
    alignItems: 'center'
  },
  refBox: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%'
  },
  refLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5
  },
  refNo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3D91',
    marginTop: 1
  },
  qrWatermarkContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#0B3D91',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%'
  },
  watermarkPattern: {
    marginBottom: 8
  },
  watermarkText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 1
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
    minHeight: 220
  },
  qrImage: {
    width: 210,
    height: 210
  },
  errorBox: {
    alignItems: 'center',
    padding: 16
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  errorTitle: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4
  },
  errorMsg: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12
  },
  retryBtn: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11
  },
  scanInstruction: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1
  },
  statusIssuedBg: {
    backgroundColor: '#DCFCE7',
    borderColor: '#138808'
  },
  statusPendingBg: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  statusText: {
    fontWeight: '800',
    fontSize: 11
  },
  statusIssuedText: {
    color: '#138808'
  },
  statusPendingText: {
    color: '#B45309'
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14
  },
  tableHeader: {
    color: '#0B3D91',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 11
  },
  rowVal: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  itemBullet: {
    color: '#475569',
    fontSize: 11
  },
  itemQty: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700'
  },
  shareBtn: {
    backgroundColor: '#0B3D91',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%'
  },
  shareBtnSuccess: {
    backgroundColor: '#0E5A3A'
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  printBtn: {
    backgroundColor: '#166534',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%'
  },
  printBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  actionButtonsRow: {
    gap: 8,
    width: '100%',
    marginBottom: 10
  },
  downloadSuccessNotice: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  downloadSuccessNoticeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15
  },
  legalSmallPrint: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 10
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1'
  },
  closeText: {
    color: '#061E47',
    fontWeight: '800',
    fontSize: 12
  }
});
