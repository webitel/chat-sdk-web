export const MessageAttachmentType = {
	Documents: 'documents',
	Images: 'images',
} as const;

export type MessageAttachmentType =
	(typeof MessageAttachmentType)[keyof typeof MessageAttachmentType];
