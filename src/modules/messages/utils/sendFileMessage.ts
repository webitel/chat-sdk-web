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

	const uploadResponse = await getMessagesService(config).uploadFile(threadId, file);
	const fileId = (uploadResponse as { id?: string }).id ?? uploadResponse.fileId;

	if (!fileId) {
		throw new Error('Storage upload did not return file id');
	}

	return getMessagesService(config).sendFileMessage({
		...restParams,
		document: {
			...document,
			documents: [
				{
					fileName: file.name,
					id: fileId,
					mimeType: file.type,
					sizeBytes: String(file.size),
					url: uploadResponse.fileUrl,
				},
			],
		},
	});
};

export { sendFileMessage };
