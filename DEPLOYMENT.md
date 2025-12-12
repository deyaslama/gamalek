# Render.com Deployment Guide

## Project Structure

```
backend/
   server.js
   package.json
   data/
      uploads/   (empty folder, tracked by git)
      database.db.example
frontend/
admin/
render.yaml
.gitignore
```

## Persistent Storage

All persistent data (database and uploads) is stored in the `data/` directory at the project root, which is mounted to Render's persistent disk.

### Database
- Location: `data/database.db`
- This file is automatically created on first run
- The `.example` file is just a placeholder for git

### Uploads
- Location: `data/uploads/`
- All uploaded images and files are stored here
- Files persist across deployments

## Environment Variables

Set these in Render Dashboard:

- `NODE_ENV` = `production`
- `PORT` = `10000` (or let Render assign it)
- `SESSION_SECRET` = (your secret key)
- `ADMIN_USERNAME` = (your admin username)
- `ADMIN_PASSWORD` = (your admin password)
- `EMAIL_USER` = (your email for nodemailer)
- `EMAIL_PASS` = (your email password for nodemailer)

## GitHub Upload Instructions

### 1. Before First Commit

1. **Move existing database** (if you want to keep it):
   ```bash
   # Backup your current database
   cp backend/database.db backend/data/database.db
   ```

2. **Move existing uploads** (if you want to keep them):
   ```bash
   # Copy existing uploads to new location
   xcopy backend\uploads\* backend\data\uploads\ /E /I
   ```

### 2. Commit to GitHub

Files to commit:
- ✅ `backend/server.js` (updated)
- ✅ `backend/package.json`
- ✅ `backend/data/uploads/.gitkeep`
- ✅ `backend/data/database.db.example`
- ✅ `frontend/` (entire folder)
- ✅ `admin/` (entire folder)
- ✅ `render.yaml`
- ✅ `.gitignore`
- ✅ `layout.html`
- ✅ `login.html`

Files NOT to commit (handled by .gitignore):
- ❌ `backend/node_modules/`
- ❌ `backend/data/database.db` (actual database)
- ❌ `backend/data/uploads/*` (actual uploaded files)
- ❌ `.env` (environment variables)

### 3. Initial Setup on Render

1. Connect your GitHub repository to Render
2. Render will detect `render.yaml` automatically
3. Set environment variables in Render Dashboard
4. The persistent disk will be created automatically
5. First deployment will create the database

### 4. Upload Existing Data (Optional)

If you have existing data to migrate:

1. After first deployment, use Render Shell or connect via SSH
2. Upload your `database.db` to `/opt/render/project/src/data/`
3. Upload your uploads to `/opt/render/project/src/data/uploads/`

## URL Structure

After deployment, your URLs will be:
- Frontend: `https://your-app.onrender.com/`
- Admin: `https://your-app.onrender.com/admin/`
- Uploads: `https://your-app.onrender.com/uploads/filename`

## Important Notes

1. **HTTPS**: On Render, set `cookie.secure = true` in `server.js` session config for production
2. **Database**: The database is automatically created on first run if it doesn't exist
3. **Uploads**: All uploads persist in the mounted disk and survive deployments
4. **Environment**: Make sure all environment variables are set in Render Dashboard

## Troubleshooting

- If uploads don't work: Check that the persistent disk is mounted correctly
- If database resets: Verify the disk mount path in `render.yaml`
- If static files don't load: Check the paths in `server.js` match your structure

