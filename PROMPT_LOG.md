# Prompt Log

## Prompt 1
```
ROLE
You are a senior security engineer and frontend developer. Build a hackathon MVP that must work perfectly in a live demo. It is scored automatically on: code quality, security, efficiency, testing, accessibility, problem-statement alignment and Google services usage. Optimise for all of them.

PROBLEM
People share logs, resumes, support tickets and clinical notes that contain PII. Build "RedactIQ": a browser-based tool where users paste text or upload a .txt/.csv file, and the app detects, classifies and redacts PII ENTIRELY ON THE CLIENT SIDE. No data may ever be sent to any server or external API.

TECH STACK (do not add anything else)
- Vite + React (JavaScript), plain CSS
- No backend, no external APIs, no AI API calls, no analytics, no CDN links, no external fonts (use system fonts)
- Vitest for unit tests, ESLint for linting

1. DETECTION ENGINE (src/lib/detectors.js — pure functions, no React)
Detect and classify these entity types, each with its own colour:
- EMAIL: standard email addresses
- PHONE: Indian mobile numbers (10 digits starting 6-9, optional +91 / 0 prefix, spaces or dashes allowed) and common international formats like +1 555-123-4567
- IP: IPv4 with every octet validated 0-255 (reject 999.1.1.1); also IPv6 if simple to add
- PAN: Indian PAN format [A-Z]{5}[0-9]{4}[A-Z], case-insensitive, 4th letter must be one of P,C,H,F,A,T,B,L,J,G
- AADHAAR: 12 digits, first digit 2-9, optionally grouped 4-4-4 with spaces or dashes, VALIDATED WITH THE VERHOEFF CHECKSUM
- CREDIT_CARD: 13-19 digits, optionally separated by spaces or dashes, VALIDATED WITH THE LUHN ALGORITHM. Random 16-digit numbers that fail Luhn must NOT be flagged.
Rules:
- Return a list of matches: { type, value, start, end, normalized }
- normalized = lowercase for emails; digits only for phone/card/Aadhaar; uppercase for PAN
- Resolve overlaps so no two matches overlap (prefer the longer, validated match; card > aadhaar > phone)
- Use word boundaries so numbers inside longer numbers are not partly matched
- Also return how many card-like numbers failed Luhn

2. REDACTION MODES (src/lib/redact.js)
- Full Mask: replace each entity with [REDACTED_<TYPE>] e.g. [REDACTED_EMAIL]
- Partial Mask: keep a little context:
  email j***@gmail.com · phone XXXXXX3210 · card XXXX-XXXX-XXXX-1234 · Aadhaar XXXX-XXXX-1234 · PAN XXXXX1234X · IP 192.168.XXX.XXX
- Consistent Pseudonymization: the same entity always maps to the same placeholder across the whole document, using its normalized value (so "+91 98765 43210" and "9876543210" are the same person): EMAIL_01, PHONE_01, CARD_01, AADHAAR_01, PAN_01, IP_01, numbered in order of first appearance
- Replacement text must never contain commas, so CSV structure stays intact

3. INPUT
- Large textarea to paste text
- Upload button + drag-and-drop for .txt and .csv files only (read with FileReader, show the file name; reject other types with a friendly message)
- "Load sample" button that fills a realistic noisy sample (a support ticket + log lines + a small CSV-style block) containing: repeated emails, Indian phones in different formats, valid and invalid IPs, valid PANs, Aadhaar numbers that PASS Verhoeff and one that fails, credit cards that PASS Luhn (e.g. 4111 1111 1111 1111) and a random 16-digit number that FAILS Luhn. Verify every sample value with the validators.

4. AUDIT VIEW
- Mode selector (3 options) and checkboxes to turn each entity type on/off
- Live side-by-side view: left = original text with detected entities highlighted in their type colour (show the type label too); right = sanitized output with the replacements highlighted. Updates instantly when text, mode or toggles change.
- Summary bar with a count per entity type and a total
- Note under the counts: "Luhn-failed numbers ignored: N"
- In pseudonymization mode, show a mapping table (placeholder -> original) with a warning that it contains sensitive data and is NOT included in the download

5. EXPORT
- 1-click "Download sanitized file": same format as the input (.txt or .csv), named sanitized_<originalname> (or sanitized_output.txt for pasted text)
- "Copy to clipboard" button

6. DESIGN
- Clean, professional security-tool look; dark theme with one accent colour; header with the app name, tagline "Redact PII. Nothing leaves your browser." and a "100% client-side" badge
- Responsive: on mobile, the two panels stack vertically
- Accessible: semantic HTML, labels, aria-labels on icon buttons, aria-live region for the counts, contrast of at least 4.5:1, keyboard navigation, visible focus states; colours are never the only signal
- Empty state, friendly error messages, no crashes on empty input or huge files (warn above 5 MB)

7. CODE QUALITY, SECURITY, EFFICIENCY, TESTING
- Clean, modular code: components in src/components, logic in src/lib; JSDoc comments on every function in src/lib; no unused code or console.logs
- ESLint (recommended React config); `npm run lint` must pass with zero errors
- Never use dangerouslySetInnerHTML; render highlights as React elements so user text can never run as HTML
- The pseudonymization mapping is kept only in memory, never saved or downloaded; no secrets anywhere in the repo
- Content-Security-Policy (default-src 'self'; connect-src 'none'; style-src 'self' 'unsafe-inline'; no inline scripts) applied ONLY in the production build (nginx header and the built index.html), NOT in the Vite dev server, so live reload keeps working
- Debounce re-detection while typing (about 200 ms) and use useMemo for detection results; a 1 MB text must not freeze the page
- Vitest unit tests in src/lib/__tests__ covering: each detector (valid and invalid cases), Luhn, Verhoeff, overlap resolution, all 3 redaction modes, and pseudonymization consistency; `npm test` script; all tests must pass

8. DEPLOYMENT (Google Cloud Run)
- Multi-stage Dockerfile: stage 1 node:20-alpine runs npm ci and npm run build; stage 2 nginx:alpine serves /dist on port 8080
- nginx.conf: listen 8080, SPA fallback to index.html, gzip on, security headers (Content-Security-Policy, X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer, Permissions-Policy)
- .dockerignore with node_modules, dist, .git
- README.md: features, privacy design, how to run, how to test, and a Deployment section describing Cloud Run + Cloud Build

9. GIT RULES
- This folder is a cloned public GitHub repo. Work ONLY on the main branch. Never create other branches.
- Before the first commit, create a .gitignore with node_modules, dist, .env and .DS_Store
- The repo must stay under 10 MB: never commit node_modules, build output or large files
- Keep the existing README.md and replace its content with the project README at the end
- Create PROMPT_LOG.md and append every prompt I send you, word for word, with a one-line note on what you did
- Commit after each working phase with a clear message, but do NOT push until I ask

PROCESS (follow strictly)
1. First, write an implementation plan: file structure, components and build phases. Then STOP and wait for my approval.
2. Build in this order, one phase at a time, stopping after each to show me:
   Phase 1: project setup, detection engine, validators, redaction logic and unit tests (all tests must pass)
   Phase 2: input UI (paste, upload, sample loader)
   Phase 3: redaction modes UI, side-by-side view and counts
   Phase 4: export, mapping table, polish, accessibility, Dockerfile, nginx.conf, README
3. After every phase, run the app in the browser, test it, fix any console errors, run `npm run build` once to confirm the production build works, then commit.
```
*Note: Created .gitignore, initialized PROMPT_LOG.md, and drafted detailed implementation plan for user review.*

## Prompt 2
```
Approved, with these changes:
1. Do NOT put the CSP meta tag directly in index.html. Add it only at build time with a small Vite plugin (transformIndexHtml with apply: 'build'), plus the nginx header. The dev server must have no CSP.
2. Entity highlights must use dark text on the light highlight colours so contrast stays at least 4.5:1.
3. Add one test that runs the detectors on sampleData.js and checks the expected count for each entity type.

Start Phase 1 only: set up the Vite + React project, then build constants.js, validators.js, detectors.js, redact.js, sampleData.js and the unit tests. Run `npm test` and `npm run lint`, make sure both pass, commit to main and stop. Show me the test results.
```
*Note: Starting Phase 1 - setting up Vite + React + Vitest + ESLint, building constants, validators, detectors, redaction, sampleData, and unit tests.*

## Prompt 3
```
Phase 1 looks good. Start Phase 2 only: build Header.jsx and InputSection.jsx (textarea, .txt/.csv upload with drag-and-drop and file-type check, 5 MB warning, and the "Load sample" button using sampleData.js). Wire them into App.jsx with the 200 ms debounce. Run the app, open it in the browser, test pasting, uploading and the sample button, fix any console errors, run `npm run build`, then commit to main and stop. Show me a screenshot of the app.
```
*Note: Starting Phase 2 - implementing Header.jsx, InputSection.jsx, drag-and-drop file upload with validation, 5MB warning, sample loader, 200ms debounce in App.jsx, and browser testing.*

## Prompt 4
```
Phase 2 looks good. One fix first: change the footer text "Encrypted only in local RAM · No cloud calls" to "Processed locally in your browser · No network calls", because the data is not actually encrypted.

Then start Phase 3 only: build ControlsBar.jsx (3 redaction modes + entity type toggles), SummaryBar.jsx (count per entity type, total, aria-live, and "Luhn-failed numbers ignored: N"), HighlightedText.jsx and AuditView.jsx (side-by-side original vs sanitized, with type labels on highlights). Wire everything into App.jsx using useMemo. Test all 3 modes and the toggles in the browser with the sample, check that the same email or phone always gets the same placeholder in pseudonymization mode, fix any console errors, run `npm test` and `npm run build`, then commit to main and stop. Show me screenshots of each mode.
```
*Note: Starting Phase 3 - updated footer copy, building ControlsBar, SummaryBar, safe HighlightedText, and AuditView side-by-side, wiring into App.jsx with useMemo, and automated multi-mode browser testing with screenshots.*

## Prompt 5
```
Phase 3 looks good. Before Phase 4, do a full visual redesign. Do not change any logic, detection, or tests — only styles and presentational markup.

STYLE: Premium, modern product UI (think Vercel / Linear / Stripe quality) with TWO themes:
- Premium Dark (default): near-black background (#0a0a0f style) with a subtle radial gradient glow behind the header, glassy cards (semi-transparent background, backdrop-filter blur, 1px soft border, large soft shadows)
- Premium Light: off-white background, white cards with soft layered shadows, same accent colour
- Theme toggle button in the header (sun/moon icon, aria-label, aria-pressed). Default to the user's system preference (prefers-color-scheme) and remember the choice in localStorage (wrapped in try/catch).
- Implement both themes with CSS custom properties on [data-theme], so every colour comes from variables.

BUTTONS (3D + hover):
- 3D look: subtle top highlight, gradient fill, layered box-shadows that create depth
- Hover: lift up (translateY(-2px)), stronger shadow and a soft accent glow
- Active/pressed: press down (translateY(1px)) with an inset shadow
- Primary buttons (Load Sample, Download) use the accent gradient; secondary buttons are glassy
- Smooth transitions (150-200 ms)

OTHER POLISH:
- Cards lift slightly on hover; mode selector as a segmented control with a sliding active pill
- Entity toggles as pill chips with their entity colour
- Consistent spacing scale, rounded corners (12-16px), refined typography with system fonts (no external fonts — CSP blocks them)
- Count badges with subtle colour backgrounds

MUST KEEP (scored):
- Text contrast at least 4.5:1 in BOTH themes, including highlight labels
- Visible focus rings on every interactive element in both themes
- Respect prefers-reduced-motion: disable lift/glow animations when it is set
- Responsive layout still stacks on mobile

Also: the editor shows 3 problems in src/App.jsx (see the Problems tab). Fix all of them without changing behaviour, and make sure the Problems tab shows 0 problems for the whole project.

Test both themes in the browser, check hover/focus states, run `npm test`, `npm run lint` and `npm run build`, then commit to main and stop. Show me screenshots of both themes, including one scrolled down to the side-by-side Original/Sanitized panels.
```
*Note: Completed full visual redesign with Vercel/Stripe quality dual themes (Premium Dark & Premium Light), 3D tactile buttons, glassy cards, radial header glow, segmented controls, zero-diagnostics cleanup in jsconfig.json and App.jsx, and automated browser capture.*

## Prompt 6
```
Second redesign pass. Do not change any logic, detection or tests — only visuals.

1. Open https://cosmicenterprises.co/ in the browser and study its custom cursor and its 3D / depth effects (tilt, parallax, glow, hover animations). Recreate a SIMILAR feel for RedactIQ in our own original code. Do not copy their code, images, logo or text.

2. Custom cursor:
- A small dot + a larger trailing ring that follows with smooth easing (requestAnimationFrame), grows and changes colour when hovering buttons, links and chips, and shrinks on click
- Plain CSS + vanilla JS in its own component (CustomCursor.jsx), no libraries
- ONLY enable it on devices with a fine pointer: @media (hover: hover) and (pointer: fine)
- Keep the normal text cursor inside the textarea and the output panels
- Fully disabled when prefers-reduced-motion is set
- The cursor elements must be aria-hidden and pointer-events: none

3. 3D effects (pick the ones that suit a security tool):
- Cards: subtle 3D tilt toward the mouse (max about 4 degrees, perspective) with a moving light/glare highlight; reset smoothly on mouse leave
- Buttons: keep the 3D lift/press effect, add a soft glow that follows the mouse position
- Header: slow animated gradient or particle-style glow in the background (CSS only, low cost)
- Subtle entrance animations for sections on load
- Keep all effects lightweight (transform/opacity only, no layout thrashing) so efficiency stays high

4. No external libraries, fonts or CDN links. Works in both dark and light themes.

5. Keep accessibility: contrast at least 4.5:1, visible focus rings, keyboard navigation unaffected, everything disabled under prefers-reduced-motion.

Test in the browser, run `npm test`, `npm run lint` and `npm run build`, make sure the Problems tab shows 0, then commit to main and stop. Show me screenshots.
```
*Note: Starting second visual redesign pass - implementing CustomCursor.jsx with requestAnimationFrame easing, 3D card tilt with specular glare, button mouse-follow glow, animated aurora header glow, and staggered section entrance animations.*

## Prompt 7
```
Accent gradient: #F97316 -> #F43F5E (orange to rose) in dark mode, #EA580C -> #E11D48 in light mode. Background dark #0A0705 (warm near-black), light #FFF9F5. Change the IP entity highlight colour from orange to teal (#2DD4BF) so it does not clash with the accent. Keep the "100% Client-Side" badge mint green.
```
*Note: Updated color palette: warm near-black background (#0A0705), warm off-white (#FFF9F5), orange-to-rose accent gradients, and changed IP highlight to high-contrast teal (#2DD4BF).*

## Prompt 8
```
Replace the current accent palette (no logic, layout or test changes):

Dark theme:
- Background: deep navy #050B18, cards #0B1426 with a faint teal border
- Accent gradient: #10B981 -> #14B8A6 (emerald to teal) for primary buttons, the active mode pill, the theme toggle, focus rings and the logo tile
- Glow / cursor ring / header aurora: soft emerald-teal at low opacity
- "100% Client-Side" badge: emerald

Light theme:
- Background: #F5F9FC, white cards with a faint navy border
- Accent gradient: #047857 -> #0F766E (deeper, so text on it stays at least 4.5:1)
- Headings in navy #0B1B3A

Change the PHONE entity highlight colour to lime (#A3E635) so it does not clash with the green accent. If the IP highlight was changed to teal earlier, change it back to orange (#FB923C). Keep all other entity colours.

Replace every old accent colour with these variables, check contrast in both themes, run `npm test`, `npm run lint` and `npm run build`, then commit to main and stop. Show me screenshots of both themes with the sample loaded.
```
*Note: Updated accent palette: deep navy #050B18 and #F5F9FC, emerald-teal accent gradients (#10B981 -> #14B8A6 / #047857 -> #0F766E), navy headings in light mode, lime phone highlights (#A3E635), and orange IP highlights (#FB923C).*

## Prompt 9
```
The design is final. Start Phase 4. We deploy on Vercel (primary), with Cloud Run as an alternative.

1. ExportBar.jsx: "Download sanitized file" (same format as input: .txt or .csv, named sanitized_<originalname>, or sanitized_output.txt for pasted text) and "Copy to clipboard". Both must use the plain redacted string from redact.js, NOT the on-screen text, so the small type labels (EMAIL, PHONE…) are never included. Add a unit test that the downloaded/copied text contains no type labels.
2. MappingTable.jsx: visible only in pseudonymization mode, placeholder -> original, with a clear warning that it contains sensitive data and is never included in the download.
3. vercel.json in the project root: "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist", a rewrite so all routes fall back to /index.html, and headers for all routes: Content-Security-Policy (same as the build CSP), X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer, Permissions-Policy, Strict-Transport-Security.
4. Also keep a Cloud Run option: Dockerfile (multi-stage, node:20-alpine build -> nginx:alpine serving dist on port 8080), nginx.conf (listen 8080, SPA fallback, gzip, same security headers) and .dockerignore.
5. README.md: replace the content with a full project README — problem, features, how detection works (regex + Luhn + Verhoeff), the 3 modes, privacy/security design, accessibility, tech stack, how to run, how to test, deployment (Vercel primary, Cloud Run alternative), and a "Known limitations" section (e.g. personal names are not detected because that needs NLP/AI, which would break the client-side rule).
6. Final pass: test every feature in both themes in the browser, including uploading a .csv file and downloading it, check the Problems tab shows 0 problems, run `npm test`, `npm run lint` and `npm run build`, update PROMPT_LOG.md, then commit to main.
7. Check that node_modules and dist are NOT tracked by git (`git ls-files | grep -E "node_modules|dist"` must return nothing), then push to origin main. Show me the test results and the git push output.
```
*Note: Completed Phase 4 - implemented ExportBar.jsx, MappingTable.jsx with sensitive data warning, added unit test verifying sanitized exports contain no UI labels, added vercel.json with zero-trust headers, Dockerfile and nginx.conf for Cloud Run, comprehensive README.md, browser tested all features in both themes, verified 0 git tracking of node_modules/dist, and pushed to origin main.*








