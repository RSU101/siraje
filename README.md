# Engineering Pro – Multi-Department Engineering Website

Modern multi-page engineering company site with **backend form handling**, **responsive mobile menu**, and **interactive 3D model viewers**.

## Pages

| Page | File |
|------|------|
| Home (slideshow + 3D gallery) | `index.html` |
| Mechanics | `mechanics.html` |
| Works | `works.html` |
| Electrical & Electronics | `electrical.html` |
| Manufacturing | `manufacturing.html` |
| Recycling & Repair | `recycling.html` |

## Features

- Toolbar, sticky navbar, menubar, footer on every page
- 5-image auto slideshow on home
- **Responsive mobile menu** – slide-in drawer, overlay, Escape to close, body scroll lock
- **Backend form handling** (contact + service requests stored as JSON)
- **3D model viewers** (Google model-viewer) – rotate, zoom, AR on supported devices
- Animated stats, scroll reveal, live clock
- Works offline for UI; forms fall back to demo mode if backend is not running

## Quick start (recommended)

Serve the site with PHP built-in server (forms will save for real):

```bash
cd engineering-website
php -S localhost:3001
```

Then open: **http://localhost:3001/**

- Contact / service forms POST to `backend/api.php`
- Submissions are saved in `backend/data/submissions.json`
- Check health: http://localhost:3001/backend/api.php
- List submissions: http://localhost:3001/backend/api.php?action=submissions

### Optional Node backend

```bash
cd engineering-website/backend
npm install
npm start
```

Serves the whole site + API on port 3001.

## Opening without a server

You can open `index.html` directly in a browser. Navigation and UI work. Forms will show **demo mode** success (no file write) because browsers block `file://` fetch to local PHP.

## 3D models

Home page has a 3D gallery. Mechanics and Manufacturing pages include a large interactive viewer.

Demo models load from modelviewer.dev. To use your own CAD:

1. Export as `.glb` or `.gltf`
2. Put the file in `assets/`
3. Change the `src="..."` on `<model-viewer>` to e.g. `assets/my-part.glb`

## Structure

```
engineering-website/
├── index.html
├── mechanics.html / works.html / electrical.html / manufacturing.html / recycling.html
├── css/style.css
├── js/main.js
├── backend/
│   ├── api.php          ← form API (PHP)
│   ├── server.js        ← optional Node API
│   ├── package.json
│   └── data/            ← created on first submission
└── assets/
```

## Form API

| Endpoint | Method | Body fields |
|----------|--------|-------------|
| `backend/api.php?type=contact` | POST JSON | name, email, department, message |
| `backend/api.php?type=service` | POST JSON | company, contact, phone, serviceType, details |

Both return `{ "success": true, "message": "...", "id": "..." }` on success.
