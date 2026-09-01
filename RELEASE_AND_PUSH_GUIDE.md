# 🚀 Release & Push Workflow Guide

This guide provides simple, step-by-step instructions for pushing changes, releasing new versions, and automatically building APKs with GitHub Actions.

---

## 📌 1. Normal Daily Push (No APK Release Triggered)

When you make everyday changes, bug fixes, or UI tweaks and simply want to save your work to GitHub without triggering an APK build:

```bash
git add .
git commit -m "feat(or fix): description of changes"
git push origin main
```

> **Note:** Pushing to `main` saves your code. It does **not** consume GitHub Actions build time or build a new release APK.

---

## 🚀 2. Releasing a New Version (Builds APK & Updates the App)

Whenever you want to build a new `.apk` and make it available for download in the app:

### Step 1: Bump the App Version (Optional but Recommended)
1. In `package.json`:
   ```json
   "version": "1.0.1"
   ```
2. In `app.config.ts`:
   ```typescript
   version: '1.0.1',
   ```
3. *(If you added/edited learning content)* In `src/database/contentVersion.ts`:
   ```typescript
   export const CONTENT_VERSION = 2;
   ```

### Step 2: Test Locally
```bash
npm run typecheck
npm test
```

### Step 3: Commit and Push to Main
```bash
git add .
git commit -m "chore: prepare release v1.0.1"
git push origin main
```

### Step 4: Create and Push the Release Tag
```bash
git tag -a v1.0.1 -m "Release v1.0.1 — Add new practice problems and improvements"
git push origin v1.0.1
```

---

## ⚡ 3. What Happens Automatically on GitHub

Once you push a tag starting with `v` (like `v1.0.1`):

1. **GitHub Actions kicks off**:
   - Runs `npm run typecheck` and `npm test`.
   - Compiles the Android Release APK (`coding-coach.apk`).
2. **Publishes the GitHub Release**:
   - Creates a new release under:
     `https://github.com/dagijosi/coding_coach/releases`
   - Attaches `coding-coach.apk` directly to the release.
   - **Saves Storage**: Automatically deletes older releases (keeps only the latest 2) so your GitHub storage stays well below 0.5 GB.
3. **In-App Updater Notifies Users**:
   - When users open the app and tap **"Check for Updates"** in the **Profile** tab, the app automatically finds the latest version and displays the **Download & Install APK** button.

---

## 🔘 4. How to Build an APK Manually (Without Git Tag)

If you ever want to generate an APK without creating a git tag in the terminal:

1. Open your repository in your browser:  
   `https://github.com/dagijosi/coding_coach`
2. Click the **Actions** tab at the top.
3. In the left sidebar, click **Build Android APK**.
4. Click **Run workflow** (button on the right):
   - Choose branch: `main`
   - Check **"Publish as GitHub Release?"** (default: `true`)
   - (Optional) Enter a custom release tag (e.g. `v1.0.1`)
5. Click the green **Run workflow** button.

---

## 🛠️ Quick Reference Commands

| Goal | Command |
|---|---|
| Run all tests | `npm test` |
| Check TypeScript | `npm run typecheck` |
| Check git status | `git status` |
| Create tag | `git tag -a vX.X.X -m "Release message"` |
| Push tag | `git push origin vX.X.X` |
| Delete local tag | `git tag -d vX.X.X` |
| Delete remote tag | `git push origin :refs/tags/vX.X.X` |
