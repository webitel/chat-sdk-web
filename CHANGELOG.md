# `@webitel/chat-web-sdk` Changlelog

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
