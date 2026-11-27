/**
 * @file Realistic noisy sample text for demonstrating PII detection and redaction.
 * Comprises a customer support ticket, system log lines, and a CSV-style audit block.
 * Contains both passing and failing entities to demonstrate strict validation.
 */

export const SAMPLE_TEXT = `--- SUPPORT TICKET #INC-84920 ---
Customer: Priya Sharma
Email: priya.sharma@payflow.in
Alt Contact: support@acme-corp.com
Primary Phone: +91 98765 43210
Secondary Phone: 09876543210
US Office Contact: +1 555-123-4567

Description:
User reported unauthorized charge on their card 4111 1111 1111 1111 while connecting
from branch office gateway 192.168.1.105. Please send notification to priya.sharma@payflow.in
and follow up at 9876543210.

KYC Verification Details:
- PAN Card: AAAPL1234C (Verified)
- Aadhaar UID: 2345 6789 0124 (Verhoeff checksum passed)
- Secondary Aadhaar Test: 2345 6789 0125 (Verhoeff checksum failed - MUST NOT DETECT)
- Corporate PAN: BKRPK5678M (Verified)
- Invalid PAN Reference: ABCDE1234F (4th char 'D' invalid - MUST NOT DETECT)

--- PRODUCTION SYSTEM LOGS ---
[2026-11-27T08:14:22Z] [AUTH] Request received from client IPv4: 10.0.4.12
[2026-11-27T08:14:23Z] [PROXY] Gateway IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
[2026-11-27T08:14:24Z] [SECURITY_AUDIT] Attempted connection from rogue IP: 999.1.1.1 (Invalid IP - MUST NOT DETECT)
[2026-11-27T08:14:25Z] [SECURITY_AUDIT] Subnet probe from: 256.0.0.1 (Invalid IP - MUST NOT DETECT)
[2026-11-27T08:14:26Z] [ALERT] System alert dispatched to support@acme-corp.com by node +91-91234-56789
[2026-11-27T08:14:27Z] [PAYMENT] Transaction processed for card 5500 0000 0000 0004
[2026-11-27T08:14:28Z] [WARN] Spurious tracking sequence 1234 5678 9012 3456 (Fails Luhn - MUST NOT DETECT)

--- CSV TRANSACTION EXCERPT ---
transaction_id,customer_email,phone,aadhaar_number,amount_inr
TXN-1001,priya.sharma@payflow.in,9876543210,9876 5432 1096,4500.00
TXN-1002,support@acme-corp.com,+91 98765 43210,2345 6789 0124,12850.50
`;

/**
 * Expected counts for each entity type in SAMPLE_TEXT.
 */
export const SAMPLE_EXPECTED_COUNTS = {
  EMAIL: 6,        // priya.sharma@payflow.in (3 times), support@acme-corp.com (3 times)
  PHONE: 7,        // +91 98765 43210 (2), 09876543210 (1), +1 555-123-4567 (1), 9876543210 (2), +91-91234-56789 (1)
  IP: 3,           // 192.168.1.105, 10.0.4.12, 2001:0db8:85a3:0000:0000:8a2e:0370:7334
  PAN: 2,          // AAAPL1234C, BKRPK5678M
  AADHAAR: 3,      // 2345 6789 0124 (2 times), 9876 5432 1096 (1 time)
  CREDIT_CARD: 2,  // 4111 1111 1111 1111, 5500 0000 0000 0004
  LUHN_FAILED: 1,  // 1234 5678 9012 3456 (fails Luhn)
  VERHOEFF_FAILED: 1, // 2345 6789 0125 (fails Verhoeff)
};
