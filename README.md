# Copilot Study Tool

A lightweight GitHub Pages app for working with structured study payloads generated from Microsoft Copilot or other LLM workflows.

## Features

- Paste or upload a study payload JSON file
- Load a payload from a backend session link
- View article metadata and summary
- Edit quiz questions
- Edit mind map nodes
- Export:
  - full payload JSON
  - quiz JSON
  - mind map JSON
  - OPML

## Expected payload format

See `docs/example-payload.json`.

## Session backend

The app supports query strings like:

`?session=abc123`

Edit `js/session.js` and set:

```js
const SESSION_API_BASE = "https://YOUR-BACKEND-URL.example.com";
