import { isExternalCallAllowed } from '../src/urlUtils';

describe('isExternalCallAllowed', () => {
    it('allows all when disableExternalCalls is false', () => {
        expect(isExternalCallAllowed('https://api.lukuid.com', false)).toBe(true);
        expect(isExternalCallAllowed('https://custom.endpoint.com', false)).toBe(true);
    });

    it('blocks lukuid.com when disableExternalCalls is true', () => {
        expect(isExternalCallAllowed('https://api.lukuid.com', true)).toBe(false);
        expect(isExternalCallAllowed('http://lukuid.com', true)).toBe(false);
        expect(isExternalCallAllowed('https://sub.api.lukuid.com/path', true)).toBe(false);
        expect(isExternalCallAllowed('https://LUKUID.COM', true)).toBe(false);
    });

    it('allows custom endpoints when disableExternalCalls is true', () => {
        expect(isExternalCallAllowed('https://custom.endpoint.com', true)).toBe(true);
        expect(isExternalCallAllowed('https://notlukuid.com', true)).toBe(true);
        expect(isExternalCallAllowed('http://localhost:8080', true)).toBe(true);
        expect(isExternalCallAllowed('https://lukuid.com.br', true)).toBe(true);
    });
});
