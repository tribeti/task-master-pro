import { validateString } from '@/utils/validate-string';

describe('validateString (Test sai số và exception)', () => {
    it('should return trimmed string when input is valid', () => {
        expect(validateString('  hello world  ', 'Title')).toBe('hello world');
    });

    it('should throw an error if the string is empty or contains only spaces', () => {
        expect(() => validateString('', 'Title')).toThrow('Title is required.');
        expect(() => validateString('   ', 'Title')).toThrow('Title is required.');
    });

    it('should throw an error if the string exceeds maxLength', () => {
        const longString = 'a'.repeat(501);
        expect(() => validateString(longString, 'Description', 500)).toThrow('Description must be 500 characters or less.');
    });

    it('should not throw an error if string length exactly matches maxLength', () => {
        const exactString = 'a'.repeat(500);
        expect(validateString(exactString, 'Description', 500)).toBe(exactString);
    });
});
