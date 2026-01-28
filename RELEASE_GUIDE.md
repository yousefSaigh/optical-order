# Optical Order Manager - Release Guide

## Quick Reference Cheat Sheet

### Publishing a New Release

```powershell
# 1. Set your GitHub token (if not already set)
$env:GH_TOKEN = "your_github_token_here"

# 2. Build and publish
npm run build:electron -- --publish always
```

---

## Step-by-Step Release Process

### Step 1: Update Version Number

Edit `package.json` and increment the version:

```json
"version": "1.0.3",  // Change this to your new version
```

**Version Format:** `MAJOR.MINOR.PATCH`
- **MAJOR** - Breaking changes (2.0.0)
- **MINOR** - New features (1.1.0)
- **PATCH** - Bug fixes (1.0.1)

### Step 2: Set GitHub Token

Open PowerShell and run:

```powershell
$env:GH_TOKEN = "your_github_token_here"
```

> **Note:** Token is only needed on YOUR computer for publishing. It's never included in the app.

### Step 3: Build and Publish

```powershell
npm run build:electron -- --publish always
```

This will:
- ✅ Build the React frontend
- ✅ Package the Electron app
- ✅ Create a GitHub Release (e.g., v1.0.3)
- ✅ Upload installer files

### Step 4: Verify Release

Go to: https://github.com/yousefSaigh/optical-order/releases

You should see your new release with these files:
- `Optical Order Manager Setup X.X.X.exe`
- `Optical Order Manager Setup X.X.X.exe.blockmap`
- `latest.yml`

---

## Users Will Get Updates Automatically

1. User opens the app
2. Goes to **Admin Panel → Settings → Software Updates**
3. Clicks **"Check for Updates"**
4. Downloads and installs the new version

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Token is invalid or expired. Create a new one. |
| `404 Not Found` | Check repo is **public** and owner/repo name is correct in package.json |
| `Release already exists` | Version number already has a release. Increment the version. |
| `EBUSY file locked` | Close any running instances of the app before building. |

---

## GitHub Token Management

### Create a New Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `electron-updater`
4. Scope: Select `repo` (full control)
5. Click **"Generate token"**
6. Copy and save it securely

### Set Token Permanently (Optional)

To avoid setting the token every time:

1. Search "Environment Variables" in Windows
2. Click "Environment Variables..."
3. Under "User variables", click "New"
4. Variable name: `GH_TOKEN`
5. Variable value: `your_token_here`
6. Click OK

---

## Important Notes

- ⚠️ **Never commit your token** to the repository
- ⚠️ **Repository must be public** for auto-updates to work
- ✅ User data (database) is preserved during updates
- ✅ Token is only used for publishing, not in the app

---

## Package.json Configuration

Your publish settings in `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "yousefSaigh",
  "repo": "optical-order",
  "releaseType": "release"
}
```

---

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Test the app locally (`npm run dev`)
- [ ] Set `GH_TOKEN` in PowerShell
- [ ] Run `npm run build:electron -- --publish always`
- [ ] Verify release on GitHub
- [ ] Test update from previous version

