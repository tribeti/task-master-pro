import { formatRelativeTime } from '@/utils/time';

describe('Time Utils', () => {
    describe('formatRelativeTime', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-04-13T12:00:00.000Z'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('should return "Just now" for times under 60 seconds', () => {
            const date = new Date(Date.now() - 30 * 1000).toISOString();
            expect(formatRelativeTime(date)).toBe('Just now');
        });

        it('should return minutes correctly', () => {
            const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(formatRelativeTime(date)).toBe('5 phút trước');
        });

        it('should return hours correctly', () => {
            const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(date)).toBe('3 giờ trước');
        });

        it('should return 1 day correctly', () => {
            const date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(date)).toBe('1 ngày trước');
        });

        it('should return multiple days correctly', () => {
            const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            expect(formatRelativeTime(date)).toBe('3 ngày trước');
        });
    });
});
