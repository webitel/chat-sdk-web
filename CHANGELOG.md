# `@webitel/chat-web-sdk` Changlelog

## [0.0.15] - 2026-04-24

### New features

- ADDED `Thread.locateVariables()` / `createThreadsService().locateVariables(threadId)` — fetch all variables for a thread (`GET /v1/threads/{id}/variables`)
- ADDED `Thread.setVariables(params)` / `createThreadsService().setVariables(threadId, params)` — set or update thread variables; existing keys are overwritten (`POST /v1/threads/{id}/variables`)
- ADDED `Thread.flushVariables(params)` / `createThreadsService().flushVariables(threadId, params)` — remove variables by key(s); empty `keys` removes all (`DELETE /v1/threads/{id}/variables/flush`)
- ADDED `createThreadsService().searchVariables(params?)` — search variables across multiple threads with pagination (`GET /v1/variables`)
- ADDED types `ThreadVariablesModel`, `ThreadVariablesResponse`, `ThreadSetVariablesParams`, `ThreadFlushVariablesParams`, `ThreadSearchVariablesParams`, `ThreadSearchVariablesResponse` — re-exported from package root

### Fixes

- FIX `ServiceConfig`: `qs.stringify` now uses `arrayFormat: 'repeat'` — array query params (e.g. `threadIds`) serialize correctly

### Internals

- variable management isolated into `threads/modules/variables` (own API, types, utils) — mirrors `threads/modules/members` pattern

## [0.0.14] - 2026-04-23

### Breaking changes

- RENAMED `useThreadsService` → `createThreadsService`, `useMessagesService` → `createMessagesService`, `useContactsService` → `createContactsService`, `useAccountService` → `createAccountService` — `use*` prefix implied Vue composable semantics; these are plain factory functions

### Internals

- REFACTOR extracted `routeMessageSend` util — eliminates duplicate `sendMessage` switch logic between `Thread` and `Contact`
- REFACTOR API service factories now have explicit return-type interfaces (`IThreadsApiService`, `IMessagesApiService`, `IContactsApiService`, `IThreadMembersApiService`)
- REFACTOR `vue` moved from `dependencies` to optional `peerDependencies` — non-Vue consumers no longer bundle Vue unnecessarily
- FIX socket `onmessage` now wrapped in try/catch — parse errors emit typed `ChatsSocketMessage.Error` event instead of crashing the handler
- FIX exhaustiveness guards added to `processSocketEventPayload` switch statements (`default: never`)
- FIX removed double-default `params ?? {}` in service methods — callers already handle optional params
- FIX removed dead `fetchRaw*` / `getRaw*` exports from fetch utils
- FIX typo in service/socket file names (`*Sevice` → `*Service`, `ChatsSoket*` → `ChatsSocket*`)
- FIX `IThreadMember` no longer redeclares `id` (already inherited from `ThreadMemberModel`)

## [0.0.13] - 2026-04-22

### New features

- ADDED `ThreadMember` class — `thread.members` is now `IThreadMember[]`, populated from raw thread data on instantiation
- ADDED `ThreadMember.removeFromThread()` — removes the member from its thread; no args needed (thread context baked in at instantiation)
- ADDED `IThreadMember.contact` is now an `IContact` instance — full contact methods (e.g. `sendMessage`) available directly on the member
- ADDED `IThreadMember` type re-exported from the package root

### Internals

- `ThreadModel` narrowed: `id` made required (`NonNullable<WebitelImApiGatewayV1Thread['id']>`)
- `ThreadMemberModel` narrowed: `id` made required, `contact` typed as `IContact`

## [0.0.12] - 2026-04-22

### New features

- ADDED `useThreadsService().fetchThread(threadId)` — fetch single thread by ID; throws if not found (uses `GET /v1/threads?ids[]=` until a dedicated endpoint exists)
- ADDED `Thread.addMember(params)` / `useThreadsService().addMember(threadId, params)` — add a member to a thread
- ADDED `Thread.removeMember(params)` / `useThreadsService().removeMember(threadId, params)` — remove a member from a thread
- ADDED `ThreadMemberRole` enum, `ThreadMemberModel`, `ThreadMemberContact`, `ThreadAddMemberParams`, `ThreadRemoveMemberParams` types — re-exported from the package root

### Fixes

- FIXED `SocketThreadModel`: field renamed `kind` → `type` to match server contract

### Internals

- member management isolated into `threads/modules/members` (own API, types, utils)
- CI: GitHub Actions workflows added for lint (`biome ci`), typecheck (`vue-tsc --noEmit`), and tests (`vitest run`)
- biome config updated; all source files reformatted

## [0.0.11] - 2026-04-21

### Breaking changes

- `Message` model: `{ document: { body, document } }` → `{ body, documents: [] }`, same for `images`

### Internals

- up `@webitel/api-services`
- internals refactors according to Message model changes

## [0.0.10] - 2026-04-17

### Breaking changes

- REMOVED `{ body, documents, images }` shape from `Thread.sendMessage`...
- ... ADDED `{ body, attachments }` shape, where `attachments` is a tagged union `{ type: MessageAttachmentType, files }` — a single message carries at most one attachment kind alongside text
- MOVED `sendId` out of the payload into a second optional options arg: `sendMessage(params, { sendId? })`

### New features

- ADDED `Contact.sendMessage({ body, attachments }, { sendId? })` — mirrors `Thread.sendMessage` but targets a contact peer (uploads file via `${sub}:${iss}` storage key, no thread required)
- ADDED public `MessageAttachmentType` const-enum (`Documents` / `Images`) for typing/switching on attachment kinds

### Internals

- shared `IMessageSender` interface extracted to `modules/messages`; both `IThread` and `IContact` now implement it, guaranteeing a single `sendMessage` contract across peer types
- internal `resolveUploadKey` utility extracted — picks `threadId` or `${sub}:${iss}` for the storage upload endpoint

## [0.0.9] - 2026-04-17

### Breaking changes

- REMOVED `Thread.sendTextMessage` / `.sendDocumentMessage` / `.sendImageMessage`...
- ... ADDED unified method `Thread.sendMessage({ body, documents, images })` as a replacement

### Updates

- re-gen and updated `@webitel/api-services`
