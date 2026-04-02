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

	const uploaded = await getMessagesService(config).uploadFile(threadId, file);

	return getMessagesService(config).sendImageMessage({
		...restParams,
		image: {
			...image,
			images: [
				{
					id: `${uploaded.id}`,
					// link: uploaded.shared,
					mimeType: uploaded.mime,
					name: uploaded.name,
				},
			],
		},
	});
};

export { sendImageMessage };
