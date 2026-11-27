# Security & Privacy Policy 🛡️

## Privacy Model Overview

RedactIQ is architected around a strict **zero-trust, client-side only** privacy model. The application guarantees that sensitive data, personal records, and PII are never transmitted across any network or retained beyond ephemeral browser RAM.

---

### Core Security Tenets

1. **Zero Network Egress (No Backend, No Cloud APIs)**
   - RedactIQ has no backend servers, no external analytics, no cloud AI endpoints, and no CDN dependencies.
   - All detection, regex matching, mathematical checksums, and string replacements are executed strictly inside the user's local browser runtime.
   - Enforced in production via a hardened HTTP and meta Content Security Policy:
     ```http
     Content-Security-Policy: default-src 'self'; connect-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:;
     ```
     `connect-src 'none'` instructs the browser to unconditionally block all outgoing `fetch`, `XMLHttpRequest`, `WebSocket`, and `EventSource` connections.

2. **Volatile In-Memory Architecture**
   - User text, uploaded file contents, detection tokens, per-item overrides, and pseudonymization mapping tables exist exclusively in active React state memory.
   - **Zero User Data in Persistent Storage**: No user text or PII is ever written to `localStorage`, `sessionStorage`, `IndexedDB`, or browser cookies. The only value persisted is the user's UI theme selection (`dark` or `light`).
   - Closing or refreshing the browser tab instantly and permanently purges all loaded data from memory.

3. **Safe DOM Construction (XSS Prevention)**
   - Highlighting spans and audit tokens are rendered as structured React virtual DOM elements with explicit character index offsets.
   - The application strictly forbids `dangerouslySetInnerHTML` to prevent cross-site scripting (XSS).

4. **Input Sanitization**
   - Uploaded file names are strictly sanitized to strip directory traversal sequences (`../`), control characters, and special filesystem characters before presentation or inclusion in export filenames.

5. **Mathematical Algorithmic Integrity**
   - Indian Aadhaar numbers are verified with the dihedral $D_5$ group Verhoeff algorithm.
   - Payment card numbers are verified with the modulo-10 Luhn algorithm.
   - IP octets are constrained strictly to numerical ranges ($0–255$).
   - JSON Audit Reports record aggregate counts, risk scores, and compliance tags with a mathematical guarantee of **zero raw or unmasked PII**.

---

### Reporting a Vulnerability

If you discover a potential security vulnerability in RedactIQ, please submit an issue via GitHub or contact the maintainers directly. Vulnerability reports are handled promptly with high priority.
