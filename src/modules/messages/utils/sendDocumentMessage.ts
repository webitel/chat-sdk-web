import castArray from 'lodash/castArray';

import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
} from '../types/Message.types';
import { resolveUploadKey } from './resolveUploadKey';

const sendDocumentMessage = async (
	config: ServiceConfig,
	params: MessageSendDocumentParams,
): Promise<MessageSendDocumentRawResponse> => {
	const { files, body, ...rest } = params;
	const filesArr = castArray(files);
	const uploadKey = resolveUploadKey(rest.to);

	if (filesArr.length === 0) {
		throw new Error('At least one file is required to send a document message');
	}

	const messagesService = getMessagesService(config);
	const uploadedFiles = await messagesService.uploadFiles(uploadKey, filesArr);

	const uploadedDocuments = uploadedFiles.map((file) => ({
		fileName: file.name,
		id: `${file.id}`,
		mimeType: file.mime,
		sizeBytes: `${file.size}`,
	}));

	return messagesService.sendDocumentMessage({
		...rest,
		document: {
			body,
			documents: uploadedDocuments,
		},
	});
};

export { sendDocumentMessage };
