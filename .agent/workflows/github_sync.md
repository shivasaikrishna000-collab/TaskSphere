---
description: Sync project with GitHub (add remote, push, pull)
---

## Steps

1. **Add GitHub remote** (run once)
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/mern-task-manager.git
   ```

2. **Push to GitHub**
   ```bash
   git push -u origin main   # or master if that is your default branch
   ```

3. **Pull latest changes**
   ```bash
   git pull origin main   # or master
   ```

### Optional: Automate with a script
You can create a small helper script `git-sync.bat` on Windows that runs the above commands sequentially. Place it in the project root.

```bat
@echo off
rem git-sync.bat – sync with GitHub

rem Ensure we are in the project root
cd /d "%~dp0"

rem Add remote if not present
git remote | findstr /i "origin" >nul || (
  echo Adding remote...
  git remote add origin https://github.com/<YOUR_USERNAME>/mern-task-manager.git
)

rem Push changes
git push -u origin main

rem Pull latest
git pull origin main
```

> **Note**: Replace `<YOUR_USERNAME>` with your actual GitHub username and adjust the branch name if you use a different default.

---
