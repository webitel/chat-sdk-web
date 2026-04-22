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

	// biome-ignore lint/suspicious/noTemplateCurlyInString: test naming
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

	it('throws when peer is missing required fields', () => {
		const expected =
			'to.threadId or to.contact.{sub,iss} is required to resolve a storage upload key';
		expect(() => resolveUploadKey(undefined)).toThrow(expected);
		expect(() => resolveUploadKey({})).toThrow(expected);
		expect(() =>
			resolveUploadKey({
				contact: {
					sub: 's',
				},
			}),
		).toThrow(expected);
		expect(() =>
			resolveUploadKey({
				contact: {
					iss: 'i',
				},
			}),
		).toThrow(expected);
	});
});
