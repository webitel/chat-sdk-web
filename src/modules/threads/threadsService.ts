import type { ServiceConfig } from '../configs';
import { addMember } from './modules/members/utils/addMember';
import { removeMember } from './modules/members/utils/removeMember';
import { flushVariables } from './modules/variables/utils/flushVariables';
import { locateVariables } from './modules/variables/utils/locateVariables';
import { setVariables } from './modules/variables/utils/setVariables';
import type {
	IThread,
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadFlushVariablesParams,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
	ThreadSearchParams,
	ThreadSearchResult,
	ThreadSetVariablesParams,
	ThreadVariablesResponse,
} from './types/Thread.types';
import { fetchThread, fetchThreads } from './utils/fetchThreads';

interface IThreadsService {
	fetchThread: (threadId: string) => Promise<IThread>;
	fetchThreads: (params?: ThreadSearchParams) => Promise<ThreadSearchResult>;
	addMember: (
		threadId: string,
		params: ThreadAddMemberParams,
	) => Promise<ThreadAddMemberResponse>;
	removeMember: (
		threadId: string,
		params: ThreadRemoveMemberParams,
	) => Promise<ThreadRemoveMemberResponse>;
	locateVariables: (threadId: string) => Promise<ThreadVariablesResponse>;
	setVariables: (
		threadId: string,
		params: ThreadSetVariablesParams,
	) => Promise<ThreadVariablesResponse>;
	flushVariables: (
		threadId: string,
		params: ThreadFlushVariablesParams,
	) => Promise<ThreadVariablesResponse>;
}

export function createThreadsService(config: ServiceConfig): IThreadsService {
	return {
		fetchThread: (threadId: string) => fetchThread(config, threadId),
		fetchThreads: (params?: ThreadSearchParams) => fetchThreads(config, params),
		addMember: (threadId: string, params: ThreadAddMemberParams) =>
			addMember(config)(threadId, params),
		removeMember: (threadId: string, params: ThreadRemoveMemberParams) =>
			removeMember(config)(threadId, params),
		locateVariables: (threadId: string) => locateVariables(config)(threadId),
		setVariables: (threadId: string, params: ThreadSetVariablesParams) =>
			setVariables(config)(threadId, params),
		flushVariables: (threadId: string, params: ThreadFlushVariablesParams) =>
			flushVariables(config)(threadId, params),
	};
}
