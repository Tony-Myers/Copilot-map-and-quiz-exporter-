# Study Quiz & Mind Map Tool

A combined GitHub Pages app for working with structured study payloads generated from Microsoft Copilot or similar tools.

## What changed

This version extends the earlier MVP by:
- restoring useful quiz exports: Standalone HTML, Moodle XML, Aiken, GIFT, CSV, worksheet
- restoring richer mind-map support: layout setting, attached links, attached documents, attached image field
- adding Standalone HTML Mind Map export
- keeping full JSON exports in an Advanced section

## Files to replace in the combined app

- `index.html`
- `styles.css`
- `app.js`
- `js/payload.js`
- `js/session.js`
- `js/quiz.js`
- `js/mindmap.js`
- `js/export.js`

## Session backend

Edit `js/session.js` and set:

```js
const SESSION_API_BASE = "https://YOUR-BACKEND-URL.example.com";
```

## Payload format

See `docs/example-payload.json`.
