import castArray from 'lodash/castArray';

import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendImageParams,
	MessageSendImageRawResponse,
} from '../types/Message.types';

const sendImageMessage = async (
	config: ServiceConfig,
	params: MessageSendImageParams,
): Promise<MessageSendImageRawResponse> => {
	const filesArr = castArray(params.files);
	const { threadId } = params.to;

	if (!threadId) {
		throw new Error('threadId is required to send an image message');
	}

	if (filesArr.length === 0) {
		throw new Error('At least one file is required to send an image message');
	}

	const messagesService = getMessagesService(config);
	const uploadedFiles = await messagesService.uploadFiles(threadId, filesArr);

	const uploadedImages = uploadedFiles.map((file) => ({
		id: `${file.id}`,
		mimeType: file.mime,
		name: file.name,
	}));

	return messagesService.sendImageMessage({
		...params,
		image: {
			images: uploadedImages,
		},
	});
};

export { sendImageMessage };
