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
	const { files, threadId, image, ...restParams } = params;

	if (files.length === 0) {
		throw new Error('At least one file is required to send an image message');
	}

	const messages = getMessagesService(config);
	const uploaded = await Promise.all(
		files.map((file) => messages.uploadFile(threadId, file)),
	);

	const uploadedImages = uploaded.map((u) => ({
		id: `${u.id}`,
		// link: u.shared,
		mimeType: u.mime,
		name: u.name,
	}));

	return messages.sendImageMessage({
		...restParams,
		image: {
			...image,
			images: [
				...(image?.images ?? []),
				...uploadedImages,
			],
		},
	});
};

export { sendImageMessage };
