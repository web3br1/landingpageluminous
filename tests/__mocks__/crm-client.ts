// Mock for CRM client - used by integration tests
export const createCRMClient = vi.fn(() => ({
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn().mockResolvedValue(true),
  isConnected: vi.fn().mockReturnValue(true),
  healthCheck: vi.fn().mockResolvedValue({ status: 'healthy' }),
}));

export const createContact = vi.fn().mockResolvedValue({
  id: 'mock-contact-id',
  email: 'test@example.com',
  created: true,
});

export const getContact = vi.fn().mockResolvedValue({
  id: 'mock-contact-id',
  email: 'test@example.com',
  name: 'Test User',
});
