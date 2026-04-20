import type { WebitelImApiGatewayV1Peer as MessagePeer } from '@webitel/api-services/gen/models';

/**
 * Derives the storage upload path key from a message `to` peer.
 *
 * The backend file upload endpoint is shaped as
 * `/storage/file/{key}/upload`, where `{key}` is:
 * - `threadId` for existing threads
 * - `${sub}:${iss}` for contact peers (no thread yet)
 *
 * Throws when the peer carries neither piece of info.
 */
const resolveUploadKey = (to: MessagePeer | undefined): string => {
	if (to?.threadId) return to.threadId;

	const { sub, iss } = to?.contact ?? {};
	if (sub && iss) return `${sub}:${iss}`;

	throw new Error(
		'to.threadId or to.contact.{sub,iss} is required to resolve a storage upload key',
	);
};

export { resolveUploadKey };
