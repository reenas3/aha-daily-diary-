# Daily Diary PWA

A Progressive Web App for construction site daily diary management.

## Features

- Daily form with sections for:
  - Weather conditions
  - Daily notes
  - Safety updates
  - Tasks performed
  - Labor tracking
  - Equipment usage
  - Materials used
  - Subcontractor work
- Digital signature capture
- Save drafts to Firebase
- Submit entries to Firestore
- Export to PDF or Excel
- Offline support with sync
- PWA installable experience

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Firebase (Firestore + Auth)
- PWA support
- jsPDF for PDF export
- SheetJS for Excel export
- react-signature-canvas for signatures

## Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd daily-diary-pwa
```

2. Install dependencies:

```bash
npm install
```

3. Create a Firebase project at https://console.firebase.google.com

4. Enable Firestore Database and Authentication (Email/Password) in your Firebase project

5. Set up environment variables:

   - Copy `.env.example` to create your `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Update the values in `.env` with your Firebase config:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

6. Start the development server:

```bash
npm run dev
```

7. Build for production:

```bash
npm run build
```

## Deployment

1. Build the project:

```bash
npm run build
```

2. Deploy to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## License

MIT
