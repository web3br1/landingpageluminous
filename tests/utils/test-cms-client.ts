// Mock CMS Client para testes
// Este arquivo simula um cliente CMS para testes de integração

export interface CMSContent {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface CMSClient {
  getContent(id: string): Promise<CMSContent | null>;
  getAllContent(): Promise<CMSContent[]>;
  createContent(content: Omit<CMSContent, "id">): Promise<CMSContent>;
  updateContent(
    id: string,
    content: Partial<CMSContent>,
  ): Promise<CMSContent | null>;
  deleteContent(id: string): Promise<boolean>;
}

// Mock implementation
export class MockCMSClient implements CMSClient {
  private content: Map<string, CMSContent> = new Map();

  constructor(initialContent: CMSContent[] = []) {
    initialContent.forEach((item) => {
      this.content.set(item.id, item);
    });
  }

  async getContent(id: string): Promise<CMSContent | null> {
    return this.content.get(id) || null;
  }

  async getAllContent(): Promise<CMSContent[]> {
    return Array.from(this.content.values());
  }

  async createContent(
    contentData: Omit<CMSContent, "id">,
  ): Promise<CMSContent> {
    const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const content: CMSContent = { ...contentData, id };
    this.content.set(id, content);
    return content;
  }

  async updateContent(
    id: string,
    updates: Partial<CMSContent>,
  ): Promise<CMSContent | null> {
    const existing = this.content.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.content.set(id, updated);
    return updated;
  }

  async deleteContent(id: string): Promise<boolean> {
    return this.content.delete(id);
  }
}

// Factory function
export function createMockCMSClient(
  initialContent: CMSContent[] = [],
): CMSClient {
  return new MockCMSClient(initialContent);
}

// Default instance
export const mockCMSClient = createMockCMSClient([
  {
    id: "hero-content",
    title: "Hero Section",
    content: "Welcome to our platform",
    metadata: { type: "hero", priority: 1 },
  },
  {
    id: "features-content",
    title: "Features Section",
    content: "Our amazing features",
    metadata: { type: "features", priority: 2 },
  },
]);
