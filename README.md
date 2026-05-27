# Interactive Storytelling Portfolio

An immersive Next.js portfolio built as a cinematic developer journey with:

- a modern hero and physics-driven hanging ID card
- an education journey timeline
- a desktop-style project explorer
- a VSCode-inspired project viewer
- inline editing backed by Firebase Firestore

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- React Three Fiber / Three.js
- Firebase Firestore

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON=
CONTACT_SMTP_HOST=
CONTACT_SMTP_PORT=587
CONTACT_SMTP_SECURE=false
CONTACT_SMTP_USER=
CONTACT_SMTP_PASS=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

3. Start the development server:

```bash
npm run dev
```

## Firestore Model

Editable portfolio content is stored in a single Firestore document:

- collection: `portfolio`
- document: `data`

The document stores the complete portfolio structure:

- `profile`
- `education`
- `projects`
- `contact`
- `footer`

Contact form submissions are stored separately in:

- collection: `contact_messages`

The contact form also sends an email through SMTP when these env vars are configured:

- `CONTACT_SMTP_HOST`
- `CONTACT_SMTP_PORT`
- `CONTACT_SMTP_SECURE`
- `CONTACT_SMTP_USER`
- `CONTACT_SMTP_PASS`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- optional: `CONTACT_FROM_NAME`

When Firebase Admin is configured, these mailer settings can also be managed from edit mode in the Contact section. The SMTP password is stored server-side and is never exposed back to the client.

## Server-Side Persistence

The app now uses Next.js route handlers for:

- loading portfolio data
- saving portfolio data
- admin unlock session verification
- contact form submission

When Firebase Admin credentials are available, those route handlers use the Admin SDK and do not depend on public Firestore rules.

Supported admin env patterns:

- `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`
- or:
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`

If Firebase Admin credentials are not present, the route handlers fall back to the public Firebase configuration. In that fallback mode, your Firestore rules must still allow the required operations.

## Admin Unlock

- Pull the hero ID card downward and release it.
- Enter a 12-digit passcode.
- The demo fallback passcode is `246813579246`.
- For production, set `ADMIN_PASSWORD_HASH` to your own SHA-256 hash.
- Set `ADMIN_SESSION_SECRET` so the server can sign secure admin session cookies.

## Verification

```bash
npm run typecheck
npm run build
```
