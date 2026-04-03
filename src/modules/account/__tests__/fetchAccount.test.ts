import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getAccountService } from '../api/Account.api';
import type { AccountModel } from '../types/Account.types';
import { fetchAccount } from '../utils/fetchAccount';

vi.mock('../api/Account.api', () => ({
	getAccountService: vi.fn(),
}));

const mockGetAccount = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getAccountService).mockReturnValue({
		getAccount: mockGetAccount,
	});
	mockGetAccount.mockReset();
});

describe('fetchAccount', () => {
	it('delegates to the account API', async () => {
		const account = {
			sub: 'user-sub',
			name: 'Test',
		} as AccountModel;
		mockGetAccount.mockResolvedValue(account);

		const result = await fetchAccount(serviceConfig);

		expect(result).toBe(account);
		expect(mockGetAccount).toHaveBeenCalledWith();
		expect(getAccountService).toHaveBeenCalledWith(serviceConfig);
	});
});
