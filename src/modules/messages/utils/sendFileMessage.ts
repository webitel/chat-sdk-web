import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendFileParams,
	MessageSendFileRawResponse,
} from '../types/Message.types';

const sendFileMessage = async (
	config: ServiceConfig,
	params: MessageSendFileParams,
): Promise<MessageSendFileRawResponse> => {
	const { file, threadId, document, ...restParams } = params;

	const uploaded = await getMessagesService(config).uploadFile(threadId, file);

	return getMessagesService(config).sendFileMessage({
		...restParams,
		document: {
			...document,
			documents: [
				{
					fileName: uploaded.name,
					id: `${uploaded.id}`,
					mimeType: uploaded.mime,
					sizeBytes: `${uploaded.size}`,
					// url: uploaded.shared,
				},
			],
		},
	});
};

export { sendFileMessage };
