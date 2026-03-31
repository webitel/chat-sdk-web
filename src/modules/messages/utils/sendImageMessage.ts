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
	const { file, threadId, image, ...restParams } = params;

	const uploadResponse = await getMessagesService(config).uploadFile(threadId, file);
	const imageId = (uploadResponse as { id?: string }).id ?? uploadResponse.fileId;

	if (!imageId) {
		throw new Error('Storage upload did not return file id');
	}

	return getMessagesService(config).sendImageMessage({
		...restParams,
		image: {
			...image,
			images: [
				{
					id: imageId,
					link: uploadResponse.fileUrl,
					mimeType: file.type,
					name: file.name,
				},
			],
		},
	});
};

export { sendImageMessage };
