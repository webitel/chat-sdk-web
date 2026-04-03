import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';
import type { ServiceConfig } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageSendDocumentRawResponse,
	MessageSendDocumentRequest,
	MessageSendImageRawResponse,
	MessageSendImageRequest,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageStorageUploadedFile,
} from '../types/Message.types';

/**
 * Message history for a thread: `GET /v1/{threadId}/messages`
 * @see webitel-im-api-gateway-v1-messagehistory
 */
export const getMessagesService = ({ axiosInstance }: ServiceConfig) => {
	async function getMessageHistory(
		threadId: string,
		params: MessageHistorySearchParams = {},
	): Promise<MessageHistorySearchRawResponse> {
		const transformedParams = applyTransform(params, [
			camelToSnake(),
		]);

		const response = await axiosInstance.get(`/v1/${threadId}/messages`, {
			params: transformedParams,
		});
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	}

	async function sendTextMessage(
		params: MessageSendTextParams,
	): Promise<MessageSendTextRawResponse> {
		const transformedParams = applyTransform(params, [
			camelToSnake(),
		]);

		const response = await axiosInstance.post(
			'/v1/messages/text',
			transformedParams,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	}

	/**
	 * @internal
	 *
	 * upload file to Storage before sending document/image message.
	 */
	async function uploadFiles(
		threadId: string,
		file: File | readonly File[],
	): Promise<MessageStorageUploadedFile[]> {
		const formData = new FormData();

		const filesList = Array.isArray(file)
			? file
			: [
					file,
				];
		filesList.forEach((item) => {
			formData.append('file', item);
		});

		const response = await axiosInstance.post(
			`/storage/file/${threadId}/upload`,
			formData,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]) as MessageStorageUploadedFile[];
	}

	/**
	 * @internal
	 *
	 * sendDocument message after files are uploaded to Storage.
	 */
	async function sendDocumentMessage(
		params: MessageSendDocumentRequest,
	): Promise<MessageSendDocumentRawResponse> {
		const transformedParams = applyTransform(params, [
			camelToSnake(),
		]);

		const response = await axiosInstance.post(
			'/v1/messages/document',
			transformedParams,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	}

	/**
	 * @internal
	 *
	 * sendImage message after files are uploaded to Storage.
	 */
	async function sendImageMessage(
		params: MessageSendImageRequest,
	): Promise<MessageSendImageRawResponse> {
		const transformedParams = applyTransform(params, [
			camelToSnake(),
		]);

		const response = await axiosInstance.post(
			'/v1/messages/image',
			transformedParams,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	}

	return {
		getMessageHistory,
		sendTextMessage,
		uploadFiles,
		sendDocumentMessage,
		sendImageMessage,
	};
};
