# User-Facing Messaging Standard

## Goals
- Keep messages clear, concise, and helpful.
- Avoid exposing raw internal errors to end users.
- Keep existing functionality unchanged while improving copy quality.

## Usage
- Use `notifySuccess`, `notifyError`, `notifyInfo`, `notifyWarning` from `src/lib/messages/notify.js`.
- Prefer message keys from `src/lib/messages/catalog.js`.
- For dynamic text, pass fallback text as the third argument.

## Rules
- Success message: confirm what completed.
- Error message: describe what failed and what user can try next.
- Validation message: tell users exactly what is missing/invalid.
- Never show stack traces or internal exception details in toasts.

