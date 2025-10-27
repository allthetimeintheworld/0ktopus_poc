# 🚀 Quick Start - Daily Use

## Start Everything (2 Terminals)

### Terminal 1 - Backend:
```bash
cd /home/j/Desktop/AllGoGrand
source venv/bin/activate
python api_server.py
```
✅ Should show: `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2 - Frontend:
```bash
cd /home/j/Desktop/AllGoGrand/frontend
npm run dev
```
✅ Should show: `Local: http://localhost:5173/`

## Access the App

🌐 **Open in Browser:** http://localhost:5173 (or 5174 if 5173 is busy)

## Stop Everything

Press `Ctrl+C` in both terminals

---

## 📦 Where Is Everything?

### NOT Deployed - Everything Runs Locally ❌

| What | Where | Port |
|------|-------|------|
| Frontend UI | Your machine | 5173 or 5174 |
| Backend API | Your machine | 8000 |
| Files | /home/j/Desktop/AllGoGrand | - |

**To deploy later:** Use Vercel (frontend) + Railway (backend)

---

## 🔍 Check If Running

```bash
# Check what's running
ss -tlnp | grep -E "(8000|5173)"

# Should see:
# - Port 8000 (backend/python)
# - Port 5173 or 5174 (frontend/node)
```

---

**That's it!** Both need to be running at the same time.
