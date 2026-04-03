import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getContactsService } from '../api/Contacts.api';
import { fetchContacts } from '../utils/fetchContacts';

vi.mock('../api/Contacts.api', () => ({
	getContactsService: vi.fn(),
}));

const mockGetContactsList = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getContactsService).mockReturnValue({
		getContactsList: mockGetContactsList,
	});
	mockGetContactsList.mockReset();
});

describe('fetchContacts', () => {
	it('wraps list items in Contact instances that keep the same ServiceConfig', async () => {
		mockGetContactsList.mockResolvedValue({
			items: [
				{
					sub: 's1',
					iss: 'i1',
				},
				{
					sub: 's2',
					iss: 'i2',
				},
			],
			page: 1,
		});

		const result = await fetchContacts(serviceConfig);

		expect(result.items).toHaveLength(2);
		expect(result.items[0]?.sub).toBe('s1');
		expect(result.items[0]?.iss).toBe('i1');
		expect(result.items[0]?.serviceConfig).toBe(serviceConfig);
		expect(result.page).toBe(1);
	});

	it('normalises missing items to an empty Contact list', async () => {
		mockGetContactsList.mockResolvedValue({
			items: undefined,
		});

		const result = await fetchContacts(serviceConfig);

		expect(result.items).toEqual([]);
	});

	it('forwards search params to the contacts API', async () => {
		mockGetContactsList.mockResolvedValue({
			items: [],
		});

		await fetchContacts(serviceConfig, {
			size: 20,
			page: 3,
			q: 'ann',
		});

		expect(mockGetContactsList).toHaveBeenCalledWith({
			size: 20,
			page: 3,
			q: 'ann',
		});
	});
});
