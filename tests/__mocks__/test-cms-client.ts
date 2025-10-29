// Mock CMS client for integration tests
export interface MockCMSClient {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  getContent: (path: string) => Promise<any>;
  getAllContent: () => Promise<any[]>;
  healthCheck: () => Promise<{ status: string }>;
}

export const createTestCMSClient = (): MockCMSClient => ({
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn().mockResolvedValue(undefined),
  getContent: vi.fn().mockImplementation((path: string) => {
    // Mock different content based on path
    if (path.includes('hero')) {
      return Promise.resolve({
        headline: 'Mock Hero Headline',
        subheadline: 'Mock Hero Subheadline',
        primaryCta: 'Mock CTA',
      });
    }
    if (path.includes('features')) {
      return Promise.resolve([
        { title: 'Feature 1', description: 'Description 1' },
        { title: 'Feature 2', description: 'Description 2' },
      ]);
    }
    return Promise.resolve({});
  }),
  getAllContent: vi.fn().mockResolvedValue([]),
  healthCheck: vi.fn().mockResolvedValue({ status: 'healthy' }),
});
