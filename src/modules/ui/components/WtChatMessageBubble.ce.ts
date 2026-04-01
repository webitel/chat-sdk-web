import { defineCustomElement } from 'vue';
import WtChatMessageBubble from './WtChatMessageBubble.vue';

export interface WtChatMessageBubbleProps {
	text?: string;
	sender?: string;
	time?: string;
	outgoing?: boolean;
}

export const WtChatMessageBubbleElement: CustomElementConstructor =
	defineCustomElement(WtChatMessageBubble);
