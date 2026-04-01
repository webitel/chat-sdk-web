import { WtChatAvatarElement } from './components/WtChatAvatar.ce';
import { WtChatMessageBubbleElement } from './components/WtChatMessageBubble.ce';

export type { WtChatAvatarProps } from './components/WtChatAvatar.ce';
export type { WtChatMessageBubbleProps } from './components/WtChatMessageBubble.ce';
export { WtChatAvatarElement, WtChatMessageBubbleElement };

export const defaultChatUiElements: Record<string, CustomElementConstructor> = {
	'wt-chat-avatar': WtChatAvatarElement,
	'wt-chat-message-bubble': WtChatMessageBubbleElement,
};

export const registerChatUiCustomElements = (): void => {
	for (const [tagName, element] of Object.entries(defaultChatUiElements)) {
		if (!customElements.get(tagName)) {
			customElements.define(tagName, element);
		}
	}
};
