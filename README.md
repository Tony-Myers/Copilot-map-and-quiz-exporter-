# Study Tool Launcher (v2)

This version takes a different approach from the stripped-down combined app.

It preserves the original full-featured tools by:
- using a launcher page (`index.html`) for Copilot JSON import
- opening the original quiz app as `quiz-tool.html`
- opening the original mind map app as `mindmap-tool.html`

The launcher stores the Copilot payload in browser localStorage under:
`copilotStudyPayload`

Both full-featured tools contain an adapter script that reads that payload on load and imports it into their native internal data structures.

## Benefits

- Quiz tool keeps study mode and test mode.
- Quiz tool keeps Standalone HTML, Moodle XML, Aiken, GIFT, CSV and JSON export.
- Mind map tool keeps interactive standalone HTML export.
- Mind map tool keeps left-to-right, radial and top-to-bottom layouts.
- Mind map tool keeps image, document and link attachments.

## Deploy

Upload all files in this folder to a new GitHub Pages repository or replace the existing repo contents.

## Note

This is a launcher + adapter architecture, not a stripped-down reimplementation.
That is deliberate: it preserves the functionality of the original apps.
