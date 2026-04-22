import type { ServiceConfig } from '../configs';
import { addMember } from './modules/members/utils/addMember';
import { removeMember } from './modules/members/utils/removeMember';
import type {
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
	ThreadSearchParams,
	ThreadSearchResult,
} from './types/Thread.types';
import { fetchThreads } from './utils/fetchThreads';

interface IThreadsService {
	fetchThreads: (params?: ThreadSearchParams) => Promise<ThreadSearchResult>;
	addMember: (
		threadId: string,
		params: ThreadAddMemberParams,
	) => Promise<ThreadAddMemberResponse>;
	removeMember: (
		threadId: string,
		params: ThreadRemoveMemberParams,
	) => Promise<ThreadRemoveMemberResponse>;
}

export function useThreadsService(config: ServiceConfig): IThreadsService {
	return {
		fetchThreads: (params?: ThreadSearchParams) =>
			fetchThreads(config, params ?? {}),
		addMember: (threadId: string, params: ThreadAddMemberParams) =>
			addMember(config)(threadId, params),
		removeMember: (threadId: string, params: ThreadRemoveMemberParams) =>
			removeMember(config)(threadId, params),
	};
}
