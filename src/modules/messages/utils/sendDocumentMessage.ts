import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
} from '../types/Message.types';

const sendDocumentMessage = async (
	config: ServiceConfig,
	params: MessageSendDocumentParams,
): Promise<MessageSendDocumentRawResponse> => {
	const { files, threadId, document, ...restParams } = params;

	if (files.length === 0) {
		throw new Error('At least one file is required to send a document message');
	}

	const messages = getMessagesService(config);
	const uploaded = await Promise.all(
		files.map((file) => messages.uploadFile(threadId, file)),
	);

	const uploadedDocs = uploaded.map((u) => ({
		fileName: u.name,
		id: `${u.id}`,
		mimeType: u.mime,
		sizeBytes: `${u.size}`,
		// url: u.shared,
	}));

	return messages.sendDocumentMessage({
		...restParams,
		document: {
			...document,
			documents: [
				...(document?.documents ?? []),
				...uploadedDocs,
			],
		},
	});
};

export { sendDocumentMessage };
