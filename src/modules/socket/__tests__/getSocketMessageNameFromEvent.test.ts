import { describe, expect, it } from 'vitest';

import { EventPayload } from '../../../gen/ws/EventPayload';
import { getSocketMessageNameFromEvent } from '../utils/getSocketMessageNameFromEvent';

describe('getSocketMessageNameFromEvent', () => {
	it('throws until event wiring is implemented (unknown payload)', () => {
		const payload = new EventPayload({});

		expect(() => getSocketMessageNameFromEvent(payload)).toThrow(
			/^Unknown event:/,
		);
	});
});
