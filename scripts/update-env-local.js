const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const summaryPath = path.join(__dirname, '..', 'MIGRATION_SUMMARY.md');

// Service Account JSON from migration summary (Sanitized for repo)
// You should get this from your Firebase Console or MIGRATION_SUMMARY.md
const serviceAccount = {
    "type": "service_account",
    "project_id": "animal-text-battle",
    "private_key_id": "YOUR_PRIVATE_KEY_ID_HERE",
    "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@animal-text-battle.iam.gserviceaccount.com",
    "client_id": "YOUR_CLIENT_ID_HERE",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "YOUR_CERT_URL_HERE",
    "universe_domain": "googleapis.com"
};

const serviceAccountStr = JSON.stringify(serviceAccount);

// Also Firebase config
const firebaseConfig = [
    'NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC4nvXOBEOV-cfzAG8DJhWhcQpj6g94dAs"',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="animal-text-battle.firebaseapp.com"',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID="animal-text-battle"',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="animal-text-battle.firebasestorage.app"',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="243991790292"',
    'NEXT_PUBLIC_FIREBASE_APP_ID="1:243991790292:web:c9caa2e206f21a749bb141"'
];

if (!fs.existsSync(envPath)) {
    console.log('.env.local not found. Creating it.');
    fs.writeFileSync(envPath, '# Firebase Config\n');
}

let content = fs.readFileSync(envPath, 'utf8');

let updated = false;

// Append Firebase config if missing
firebaseConfig.forEach(line => {
    const key = line.split('=')[0];
    if (!content.includes(key)) {
        content += `\n${line}`;
        updated = true;
    }
});

// Append Service Account if missing
if (!content.includes('FIREBASE_SERVICE_ACCOUNT')) {
    // Use single quotes for the JSON string value if possible, or careful escaping
    // Usually .env values don't handle multi-line JSON well unless single-line
    content += `\nFIREBASE_SERVICE_ACCOUNT='${serviceAccountStr}'\n`;
    updated = true;
}

if (updated) {
    fs.writeFileSync(envPath, content);
    console.log('Updated .env.local with Firebase configuration.');
} else {
    console.log('.env.local already has configuration.');
}
