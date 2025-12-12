# Project Structure for Render.com

## Final Structure

```
your-repo/
├── backend/
│   ├── server.js          (✅ Updated with persistent paths)
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/      (❌ gitignored)
│
├── frontend/              (✅ All files)
│   ├── index.html
│   ├── css/
│   └── js/
│
├── admin/                 (✅ All files)
│   └── *.html
│
├── data/                  (✅ NEW - Persistent storage)
│   ├── uploads/           (Empty, will contain uploaded files)
│   │   └── .gitkeep
│   └── database.db.example (Empty placeholder)
│
├── layout.html            (✅ Root file)
├── login.html             (✅ Root file)
├── render.yaml            (✅ NEW - Render configuration)
├── .gitignore             (✅ NEW - Git ignore rules)
└── DEPLOYMENT.md          (✅ NEW - Deployment guide)
```

## Path Resolution in server.js

```javascript
// From backend/server.js perspective:
__dirname = /path/to/backend
rootDir = /path/to/your-repo (parent of backend)
dataDir = /path/to/your-repo/data
uploadDir = /path/to/your-repo/data/uploads
dbFile = /path/to/your-repo/data/database.db
```

## Render.com Disk Mount

The persistent disk is mounted at:
```
/opt/render/project/src/data
```

This matches the `data/` folder in your repository structure.

## What Gets Deployed

✅ **Deployed (tracked by git):**
- All code files
- `data/uploads/.gitkeep` (empty folder marker)
- `data/database.db.example` (placeholder)

❌ **NOT Deployed (gitignored, created at runtime):**
- `data/database.db` (created on first run)
- `data/uploads/*` (actual uploaded files)
- `node_modules/` (installed during build)
- `.env` (set in Render Dashboard)

## Persistent Data Flow

1. **First Deployment:**
   - Render creates disk mount at `/opt/render/project/src/data`
   - `server.js` creates `database.db` automatically
   - `uploads/` folder already exists (from git)

2. **Subsequent Deployments:**
   - Database persists in mounted disk
   - Uploaded files persist in mounted disk
   - Code updates deploy normally

3. **File Uploads:**
   - Files saved to: `data/uploads/`
   - Files served from: `/uploads/filename`
   - URLs: `https://your-app.onrender.com/uploads/filename`

