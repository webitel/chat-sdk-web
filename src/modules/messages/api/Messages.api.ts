import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';
import type { ServiceConfig } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageSendFileParams,
	MessageSendFileRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageUploadFileRawResponse,
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
		): Promise<MessageUploadFileRawResponse> => {
			const formData = new FormData();
			formData.append('file', file);

			const response = await axiosInstance.post(
				`/api/storage/file/${threadId}/upload`,
				formData,
			);
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},

		sendFileMessage: async (
			params: Omit<MessageSendFileParams, 'file' | 'threadId'>,
		): Promise<MessageSendFileRawResponse> => {
			const transformedParams = applyTransform(params, [
				camelToSnake(),
			]);

			const response = await axiosInstance.post(
				'/v1/messages/file',
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
