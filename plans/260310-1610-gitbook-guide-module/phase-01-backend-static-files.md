# Phase 1: Backend -- Serve Static HTML Guides

## Context
- [plan.md](plan.md)
- `backend/app/main.py` -- existing static file mount pattern at line 82-83

## Overview
- **Priority:** High (blocks all frontend phases)
- **Status:** pending
- **Effort:** 30m

## Key Insight
Backend already mounts `/uploads` via `StaticFiles`. Same pattern for guide files. Serve from project root `docs/` directory, not from `backend/`.

## Requirements
- Serve 5 HTML files at `/guides-static/{filename}.html`
- Files: `user-guide.html`, `sop-pms-guide.html`, `sop-crm-guide.html`, `sop-hrm-guide.html`, `sop-wsm-guide.html`
- Same-origin serving eliminates iframe CORS issues

## Related Code Files
- **Modify:** `backend/app/main.py`

## Implementation Steps

1. In `backend/app/main.py`, after the existing `/uploads` mount (line 83), add:
```python
# Serve user guide HTML files
docs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "docs")
if os.path.exists(docs_dir):
    app.mount("/guides-static", StaticFiles(directory=docs_dir, html=True), name="guides")
```

2. The `html=True` param enables serving `.html` files with correct content type.

3. Path resolution: `main.py` is at `backend/app/main.py`, so `../../docs` resolves to project root `docs/`.

## Todo
- [ ] Add static mount to `main.py`
- [ ] Verify path resolves correctly (test: `GET /guides-static/user-guide.html`)
- [ ] Verify iframe loads without CORS errors

## Success Criteria
- `http://localhost:8000/guides-static/user-guide.html` returns the full HTML guide
- All 5 HTML files accessible
- No CORS issues when loaded in iframe from `:5173`

## Risk
- Path resolution in production vs dev: use `Path(__file__).resolve().parents[2] / "docs"` for robustness
- CORS: same-origin serving from backend avoids this; frontend dev server proxies API calls to `:8000`

## Security
- Read-only static files, no user input
- Consider restricting directory listing: `StaticFiles(directory=..., html=True)` does not list directories by default
