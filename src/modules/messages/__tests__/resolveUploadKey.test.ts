import { describe, expect, it } from 'vitest';

import { resolveUploadKey } from '../utils/resolveUploadKey';

describe('resolveUploadKey', () => {
	it('returns threadId when present', () => {
		expect(
			resolveUploadKey({
				threadId: 't-1',
			}),
		).toBe('t-1');
	});

	it('prefers threadId over contact when both are present', () => {
		expect(
			resolveUploadKey({
				threadId: 't-1',
				contact: {
					sub: 's',
					iss: 'i',
				},
			}),
		).toBe('t-1');
	});

	it('builds `${sub}:${iss}` for a contact peer', () => {
		expect(
			resolveUploadKey({
				contact: {
					sub: 'sub-1',
					iss: 'iss-1',
				},
			}),
		).toBe('sub-1:iss-1');
	});

	it('returns undefined when peer is missing required fields', () => {
		expect(resolveUploadKey(undefined)).toBeUndefined();
		expect(resolveUploadKey({})).toBeUndefined();
		expect(
			resolveUploadKey({
				contact: {
					sub: 's',
				},
			}),
		).toBeUndefined();
		expect(
			resolveUploadKey({
				contact: {
					iss: 'i',
				},
			}),
		).toBeUndefined();
	});
});
