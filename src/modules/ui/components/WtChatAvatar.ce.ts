import { defineCustomElement } from 'vue';
import WtChatAvatar from './WtChatAvatar.vue';

export interface WtChatAvatarProps {
	name?: string;
	src?: string;
	size?: number | string;
}

export const WtChatAvatarElement: CustomElementConstructor = defineCustomElement(WtChatAvatar);
