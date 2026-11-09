/**
 * MediSphere AI — Enterprise Document Printing & PDF Export Engine
 * Generates official, NABH-accredited printable Hospital Letterhead documents:
 * 1. Official Medical Prescription (Rx)
 * 2. Official Itemized Tax Invoice & Receipt
 */

export function printPrescriptionDocument(rx: {
  id?: string
  patient_name?: string
  patient_id: string
  doctor_name?: string
  doctor_id?: string
  department?: string
  diagnosis?: string
  notes?: string
  issued_at?: string
  expires_at?: string
  medications: Array<{
    medicine_name: string
    dosage: string
    frequency: string
    duration_days: number
    route?: string
    special_instructions?: string
  }>
}) {
  const printWindow = window.open('', '_blank', 'width=850,height=1000')
  if (!printWindow) {
    alert('Please allow popups to export the printable document.')
    return
  }

  const dateStr = rx.issued_at
    ? new Date(rx.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const validUntilStr = rx.expires_at
    ? new Date(rx.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '30 Days from issue'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Prescription_${rx.patient_id}_${rx.id || 'Rx'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .hospital-name {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .hospital-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .nabh-badge {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
            margin-top: 6px;
          }
          .rx-id-box {
            text-align: right;
            font-size: 12px;
            color: #475569;
          }
          .rx-id {
            font-family: monospace;
            font-size: 16px;
            font-weight: 700;
            color: #2563eb;
          }
          .patient-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            font-size: 12px;
            margin-bottom: 20px;
          }
          .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .value {
            font-weight: 700;
            color: #0f172a;
          }
          .rx-symbol {
            font-family: "Georgia", serif;
            font-size: 32px;
            font-weight: 900;
            color: #2563eb;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 10px 12px;
            font-weight: 700;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .instructions {
            font-size: 11px;
            color: #d97706;
            margin-top: 2px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .disclaimer {
            font-size: 10px;
            color: #94a3b8;
            max-width: 400px;
            line-height: 1.4;
          }
          .signature-box {
            text-align: center;
          }
          .sign-line {
            width: 180px;
            border-top: 1px solid #475569;
            margin-bottom: 6px;
          }
          .doc-name {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: #fff;
            border: none;
            padding: 10px 18px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37,99,235,0.3);
          }
          @media print {
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

        <div class="header">
          <div>
            <div class="hospital-name">MEDISPHERE MULTI-SPECIALTY HOSPITAL</div>
            <div class="hospital-sub">Artificial Intelligence Assisted Healthcare Center · NABH Accredited</div>
            <div class="nabh-badge">NABH LEVEL-1 ACCREDITED · LICENSE #MED-2026-HQ</div>
          </div>
          <div class="rx-id-box">
            <div class="label">Prescription Record ID</div>
            <div class="rx-id">${rx.id || 'RX-7401'}</div>
            <div style="margin-top:4px;">Date: <strong>${dateStr}</strong></div>
          </div>
        </div>

        <div class="patient-box">
          <div>
            <div class="label">Patient Name</div>
            <div class="value">${rx.patient_name || 'Patient ' + rx.patient_id}</div>
          </div>
          <div>
            <div class="label">Hospital MR No.</div>
            <div class="value">${rx.patient_id}</div>
          </div>
          <div>
            <div class="label">Department</div>
            <div class="value">${rx.department || 'Clinical Medicine'}</div>
          </div>
          <div>
            <div class="label">Attending Doctor</div>
            <div class="value">${rx.doctor_name || 'Medical Specialist'}</div>
          </div>
        </div>

        ${rx.diagnosis ? `
          <div style="margin-bottom:16px; font-size:12px; padding:8px 12px; background:#eff6ff; border-radius:6px; border-left:4px solid #3b82f6;">
            <strong>Primary Clinical Diagnosis:</strong> ${rx.diagnosis}
          </div>
        ` : ''}

        <div class="rx-symbol">℞</div>

        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Medication Name</th>
              <th style="width: 20%;">Dosage</th>
              <th style="width: 25%;">Frequency / Schedule</th>
              <th style="width: 20%;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${rx.medications.map(m => `
              <tr>
                <td>
                  <strong>${m.medicine_name}</strong>
                  ${m.special_instructions ? `<div class="instructions">Note: ${m.special_instructions}</div>` : ''}
                </td>
                <td>${m.dosage}</td>
                <td>${m.frequency}</td>
                <td>${m.duration_days} Days (${m.route || 'Oral'})</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${rx.notes ? `
          <div style="font-size:11px; color:#475569; margin-bottom:20px; line-height:1.5;">
            <strong>Dietary & Clinical Instructions:</strong> ${rx.notes}
          </div>
        ` : ''}

        <div class="footer">
          <div class="disclaimer">
            This digital prescription is electronically authorized and linked to the Central Pharmacy dispensing inventory. Valid until ${validUntilStr}. Substitutions strictly subject to physician approval.
          </div>
          <div class="signature-box">
            <div class="sign-line"></div>
            <div class="doc-name">${rx.doctor_name || 'Authorized Medical Officer'}</div>
            <div style="font-size:10px; color:#64748b;">Signature & Reg. Stamp</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          }
        </script>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
}

export interface PrintableInvoice {
  inv?: string
  invoice_number?: string
  patient?: string
  patient_name?: string
  patient_id: string
  dept?: string
  department?: string
  amount?: number
  total?: number
  paid?: number
  amount_paid?: number
  balance_due?: number
  status: string
  date: string
  due_date?: string
  method?: string
  payment_method?: string
  consultation_fee?: number
  bed_charges?: number
  lab_charges?: number
  medicines_billed?: Array<{
    name: string
    dosage: string
    qty: number
    unit_price: number
    total: number
  }>
  items?: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
  insurance_claim?: {
    provider: string
    claim_number: string
    amount_covered: number
    status: string
  }
}

export function printInvoiceDocument(inv: PrintableInvoice) {
  const printWindow = window.open('', '_blank', 'width=850,height=1000')
  if (!printWindow) {
    alert('Please allow popups to export the printable document.')
    return
  }

  const invoiceNo = inv.inv || inv.invoice_number || 'INV-0001'
  const patientName = inv.patient || inv.patient_name || 'Patient ' + inv.patient_id
  const deptName = inv.dept || inv.department || 'Clinical Services'
  const totalAmount = inv.amount ?? inv.total ?? 0
  const paidAmount = inv.paid ?? inv.amount_paid ?? 0
  const paymentMethod = inv.method || inv.payment_method || 'Online / Counter'
  const consultationFee = inv.consultation_fee ?? 0
  const bedCharges = inv.bed_charges ?? 0
  const labCharges = inv.lab_charges ?? 0
  const medicinesBilled = inv.medicines_billed || []
  const items = inv.items || []

  const medicineTotal = medicinesBilled.reduce((a, b) => a + b.total, 0)
  const balance = Math.max(0, totalAmount - paidAmount)

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice_${invoiceNo}_${inv.patient_id}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #059669;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .hospital-name {
            font-size: 22px;
            font-weight: 800;
            color: #064e3b;
          }
          .hospital-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
          }
          .inv-title {
            text-align: right;
          }
          .inv-badge {
            font-size: 18px;
            font-weight: 800;
            color: #059669;
          }
          .patient-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            font-size: 12px;
            margin-bottom: 20px;
          }
          .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .value {
            font-weight: 700;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 9px 12px;
            font-weight: 700;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .amount-summary {
            margin-left: auto;
            width: 300px;
            font-size: 12px;
            margin-bottom: 30px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .grand-total {
            font-size: 15px;
            font-weight: 800;
            color: #065f46;
            border-top: 2px solid #059669;
            padding-top: 8px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: #fff;
            border: none;
            padding: 10px 18px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(5,150,105,0.3);
          }
          @media print {
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

        <div class="header">
          <div>
            <div class="hospital-name">MEDISPHERE AI HOSPITAL</div>
            <div class="hospital-sub">Official Tax Invoice &amp; Patient Settlement Receipt · GSTIN: 29AAAAA0000A1Z5</div>
          </div>
          <div class="inv-title">
            <div class="label">Tax Invoice Number</div>
            <div class="inv-badge">${invoiceNo}</div>
            <div style="font-size:11px; margin-top:3px;">Date: <strong>${inv.date}</strong></div>
          </div>
        </div>

        <div class="patient-box">
          <div>
            <div class="label">Patient Name</div>
            <div class="value">${patientName}</div>
          </div>
          <div>
            <div class="label">Patient MR No.</div>
            <div class="value">${inv.patient_id}</div>
          </div>
          <div>
            <div class="label">Department</div>
            <div class="value">${deptName}</div>
          </div>
          <div>
            <div class="label">Payment Mode</div>
            <div class="value">${paymentMethod}</div>
          </div>
        </div>

        ${items.length > 0 ? `
          <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:8px; text-transform:uppercase;">
            Itemized Clinical &amp; Pharmacy Services
          </div>
          <table>
            <thead>
              <tr>
                <th>Service / Item Description</th>
                <th style="text-align:center;">Quantity</th>
                <th style="text-align:right;">Unit Rate (₹)</th>
                <th style="text-align:right;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(it => `
                <tr>
                  <td><strong>${it.description}</strong></td>
                  <td style="text-align:center;">${it.quantity}</td>
                  <td style="text-align:right;">₹${it.unit_price.toLocaleString()}</td>
                  <td style="text-align:right;">₹${it.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:8px; text-transform:uppercase;">
            1. Institutional &amp; Bed Services
          </div>
          <table>
            <thead>
              <tr>
                <th>Service Description</th>
                <th>Department / Facility</th>
                <th style="text-align:right;">Charge Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Specialist Clinical Consultation Fee</td>
                <td>${deptName} Outpatient</td>
                <td style="text-align:right;">₹${consultationFee.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Inpatient Bed &amp; Nursing Station Charges</td>
                <td>${deptName} Ward</td>
                <td style="text-align:right;">₹${bedCharges.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Laboratory Diagnostics &amp; Radiology Services</td>
                <td>Central Lab &amp; Imaging</td>
                <td style="text-align:right;">₹${labCharges.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        `}

        ${medicinesBilled && medicinesBilled.length > 0 ? `
          <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:8px; text-transform:uppercase;">
            2. Pharmacy &amp; Medication Charges
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price (₹)</th>
                <th style="text-align:right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesBilled.map(m => `
                <tr>
                  <td><strong>${m.name}</strong></td>
                  <td>${m.dosage}</td>
                  <td style="text-align:center;">${m.qty}</td>
                  <td style="text-align:right;">₹${m.unit_price.toFixed(2)}</td>
                  <td style="text-align:right;">₹${m.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="amount-summary">
          <div class="summary-row grand-total">
            <span>Total Bill Amount:</span>
            <span>₹${totalAmount.toLocaleString()}</span>
          </div>
          <div class="summary-row" style="color:#059669; font-weight:700;">
            <span>Amount Paid / Settled:</span>
            <span>₹${paidAmount.toLocaleString()}</span>
          </div>
          ${balance > 0 ? `
            <div class="summary-row" style="color:#dc2626; font-weight:700;">
              <span>Balance Due:</span>
              <span>₹${balance.toLocaleString()}</span>
            </div>
          ` : `
            <div class="summary-row" style="color:#059669; font-weight:700;">
              <span>Settlement Status:</span>
              <span>FULLY PAID &amp; CLEARED</span>
            </div>
          `}
        </div>

        <div class="footer">
          <div style="font-size:10px; color:#94a3b8; max-width:400px; line-height:1.4;">
            This document is an authentic computerized tax invoice generated by MediSphere AI Hospital Billing System. Authorized cashier electronic seal applied.
          </div>
          <div style="text-align:center;">
            <div style="width:160px; border-top:1px solid #475569; margin-bottom:4px;"></div>
            <div style="font-size:11px; font-weight:700;">Hospital Cashier / Billing Desk</div>
            <div style="font-size:9px; color:#64748b;">Seal &amp; Signature</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          }
        </script>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
}
