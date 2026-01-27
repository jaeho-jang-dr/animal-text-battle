# Vercel Deployment Guide (Firebase Version)

## 1. Prepare for Deployment

Ensure all your changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Refactor for Firebase: Character, Battle, Leaderboard, and Admin Stats"
git push origin main
```

## 2. Deploy to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository (`animal-text-battle`).
4. In the **"Configure Project"** screen, go to **"Environment Variables"**.

## 3. Set Environment Variables

You MUST set the following environment variables in Vercel.
Copy the values from your local `.env.local` file.

| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| **`FIREBASE_SERVICE_ACCOUNT`** | **CRITICAL**: The full JSON content of your service account. |

### How to set `FIREBASE_SERVICE_ACCOUNT`

1. Open your `serviceAccountKey.json` (or whatever you named your admin key file).
2. Copy the **entire JSON content**.
3. In Vercel, create a new variable named `FIREBASE_SERVICE_ACCOUNT`.
4. Paste the JSON string as the value. Vercel handles JSON values automatically.

## 4. Deploy

Click **"Deploy"**.

## 5. Post-Deployment Checks

Once deployed, check the following:

1. **Characters**: Try creating a character. (Verify Firestore write)
2. **Battles**: Try a battle. (Verify Firestore transaction)
3. **Leaderboard**: Check stats. (Verify Firestore queries)
4. **Admin Panel**: Log in via `/admin` (using your admin secret setup? Note: Admin Login currently requires database verification. If you haven't set up admin user in Firestore, you might need to run a setup script or add it manually in Firebase Console -> 'users' collection -> set 'isAdmin' or check `lib/auth-helper.ts` logic).

**Note:** The app is now fully reconstructed to use Firestore (No SQL database required).
