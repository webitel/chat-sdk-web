import castArray from 'lodash/castArray';

import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendImageParams,
	MessageSendImageRawResponse,
} from '../types/Message.types';
import { resolveUploadKey } from './resolveUploadKey';

const sendImageMessage = async (
	config: ServiceConfig,
	params: MessageSendImageParams,
): Promise<MessageSendImageRawResponse> => {
	const { files, body, ...rest } = params;
	const filesArr = castArray(files);
	const uploadKey = resolveUploadKey(rest.to);

	if (filesArr.length === 0) {
		throw new Error('At least one file is required to send an image message');
	}

	const messagesService = getMessagesService(config);
	const uploadedFiles = await messagesService.uploadFiles(uploadKey, filesArr);

	const uploadedImages = uploadedFiles.map((file) => ({
		id: `${file.id}`,
		mimeType: file.mime,
		name: file.name,
	}));

	return messagesService.sendImageMessage({
		...rest,
		body,
		images: uploadedImages,
	});
};

export { sendImageMessage };
