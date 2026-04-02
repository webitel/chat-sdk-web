import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';
import type { ServiceConfig } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageStorageUploadedFile,
} from '../types/Message.types';

/**
 * Message history for a thread: `GET /v1/{threadId}/messages`
 * @see webitel-im-api-gateway-v1-messagehistory
 */
export const getMessagesService = ({ axiosInstance }: ServiceConfig) => {
	return {
		getMessageHistory: async (
			threadId: string,
			params: MessageHistorySearchParams = {},
		): Promise<MessageHistorySearchRawResponse> => {
			const transformedParams = applyTransform(params, [
				camelToSnake(),
			]);

			const response = await axiosInstance.get(`/v1/${threadId}/messages`, {
				params: transformedParams,
			});
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},

		sendTextMessage: async (
			params: MessageSendTextParams,
		): Promise<MessageSendTextRawResponse> => {
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
		},

		uploadFile: async (
			threadId: string,
			file: File,
		): Promise<MessageStorageUploadedFile> => {
			const formData = new FormData();
			formData.append('file', file);

			const response = await axiosInstance.post(
				`/storage/file/${threadId}/upload`,
				formData,
			);
			const list = response.data;
			const items = Array.isArray(list)
				? list
				: [
						list,
					];
			const first = items[0];
			if (!first) {
				throw new Error('Storage upload returned empty response');
			}
			return applyTransform(first, [
				snakeToCamel(),
			]) as MessageStorageUploadedFile;
		},

		sendDocumentMessage: async (
			params: Omit<MessageSendDocumentParams, 'files' | 'threadId'>,
		): Promise<MessageSendDocumentRawResponse> => {
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
		},

		sendImageMessage: async (
			params: Omit<MessageSendImageParams, 'file' | 'threadId'>,
		): Promise<MessageSendImageRawResponse> => {
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
		},
	};
};
