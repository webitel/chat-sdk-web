# chat-web-sdk web components example

Minimal plain HTML + JavaScript demo for custom elements from `@webitel/chat-web-sdk`.

## What this example shows

- How to register SDK custom elements once at app startup
- How to render elements in plain HTML (without Vue app mounting)
- How to pass props via attributes and content via slots

## Project structure

- `index.html` - page markup using custom tags
- `main.js` - imports SDK and registers custom elements
- `styles.css` - basic page styles for demo layout

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Setup custom elements in your own project

1. Install package:

```bash
npm install @webitel/chat-web-sdk
```

2. Register elements once in your entry file (`main.js`, `index.js`, etc):

```js
import { registerChatUiCustomElements } from '@webitel/chat-web-sdk';

registerChatUiCustomElements();
```

3. Use tags in HTML:

```html
<wt-chat-avatar name="Jane Doe" size="48"></wt-chat-avatar>

<wt-chat-message-bubble
  sender="Support Agent"
  time="10:42"
  text="Hello! How can I help you today?"
></wt-chat-message-bubble>

<wt-chat-message-bubble outgoing sender="You" time="10:43">
  I need help with my account.
</wt-chat-message-bubble>
```

## Available elements and attributes

### `wt-chat-avatar`

- `name` (`string`) - used for initials fallback
- `src` (`string`) - image URL
- `size` (`number | string`) - avatar size in pixels

### `wt-chat-message-bubble`

- `text` (`string`) - message text
- `sender` (`string`) - sender label
- `time` (`string`) - time label
- `outgoing` (`boolean`) - aligns/styles as outgoing message
- default slot - custom bubble content (overrides `text`)

## Notes

- Registering is idempotent in SDK (`customElements.define` is guarded).
- Boolean attribute usage in HTML:
  - `<wt-chat-message-bubble outgoing></wt-chat-message-bubble>` means `outgoing = true`
  - omit attribute for `false`
