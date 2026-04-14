import { fetchUserBoards, createNewBoard } from '@/services/project.service';

describe('Project Service (Test REST API mock và sai số)', () => {
    // Save original fetch
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('fetchUserBoards', () => {
        it('should return boards successfully', async () => {
            const mockData = { ownedBoards: [{ id: 1, title: 'Test API' }], joinedBoards: [] };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const result = await fetchUserBoards();
            expect(result).toEqual(mockData);
            expect(global.fetch).toHaveBeenCalledWith('/api/boards', { method: 'GET' });
        });

        it('should throw an error on API failure', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Unauthorized access' })
            });

            await expect(fetchUserBoards()).rejects.toThrow('Unauthorized access');
        });
    });

    describe('createNewBoard', () => {
        it('should send correct POST request to create board', async () => {
            const newBoardData = {
                title: 'New API Board',
                description: 'Desc',
                is_private: true,
                color: '#fff',
                tag: 'General'
            };
            const mockResponse = { id: 2, ...newBoardData };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await createNewBoard('user_123', newBoardData);
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith('/api/boards', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(newBoardData)
            }));
        });

        it('should handle validation/creation error from API', async () => {
             (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Missing required field' })
            });

            await expect(createNewBoard('user123', {} as any)).rejects.toThrow('Missing required field');
        });
    });
});
