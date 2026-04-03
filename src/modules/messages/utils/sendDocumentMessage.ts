import castArray from 'lodash/castArray';

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
	const filesArr = castArray(params.files);
	const { threadId } = params.to;

	if (!threadId) {
		throw new Error('threadId is required to send a document message');
	}

	if (filesArr.length === 0) {
		throw new Error('At least one file is required to send a document message');
	}

	const messagesService = getMessagesService(config);
	const uploadedFiles = await messagesService.uploadFiles(threadId, filesArr);

	const uploadedDocuments = uploadedFiles.map((file) => ({
		fileName: file.name,
		id: `${file.id}`,
		mimeType: file.mime,
		sizeBytes: `${file.size}`,
	}));

	return messagesService.sendDocumentMessage({
		...params,
		document: {
			documents: uploadedDocuments,
		},
	});
};

export { sendDocumentMessage };
