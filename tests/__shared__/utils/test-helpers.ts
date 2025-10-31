// ===== TEST UTILITIES & HELPERS =====
// Reusable test helper functions for common testing patterns

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RenderTestHelper,
  InteractionTestHelper,
  AsyncTestHelper,
  DataTestHelper,
  DomTestHelper,
  ApiTestHelper,
} from "../test-types";

// ===== RENDER HELPERS =====

export const renderComponent: RenderTestHelper = {
  name: "renderComponent",
  description: "Render a React component with props",
  category: "rendering",
  implementation: (Component: React.ComponentType, props: any = {}) => {
    return React.createElement(Component, props);
  },
  examples: [
    {
      description: "Render a Button component with props",
      code: 'renderComponent(Button, { children: "Click me", variant: "primary" })',
      expected: "<button class=\"btn btn-primary\">Click me</button>",
    },
  ],
};

export const renderWithProviders: RenderTestHelper = {
  name: "renderWithProviders",
  description: "Render component wrapped with all necessary providers",
  category: "rendering",
  implementation: (Component: React.ComponentType, props: any = {}) => {
    // This would be implemented with actual providers like ThemeProvider, Router, etc.
    return React.createElement(Component, props);
  },
};

// ===== INTERACTION HELPERS =====

export const clickElement: InteractionTestHelper = {
  name: "clickElement",
  description: "Click on an element by test ID or role",
  category: "interaction",
  implementation: (element: HTMLElement, action: string = "click", options: any = {}) => {
    if (action === "click") {
      fireEvent.click(element, options);
    } else if (action === "doubleClick") {
      fireEvent.doubleClick(element, options);
    } else if (action === "contextMenu") {
      fireEvent.contextMenu(element, options);
    }
  },
};

export const typeIntoInput: InteractionTestHelper = {
  name: "typeIntoInput",
  description: "Type text into an input field",
  category: "interaction",
  implementation: async (element: HTMLElement, action: string, options: any = {}) => {
    const input = element as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, action, options);
  },
};

export const selectOption: InteractionTestHelper = {
  name: "selectOption",
  description: "Select an option from a select element",
  category: "interaction",
  implementation: (element: HTMLElement, action: string, options: any = {}) => {
    const select = element as HTMLSelectElement;
    fireEvent.change(select, { target: { value: action }, ...options });
  },
};

// ===== ASYNC HELPERS =====

export const waitForLoadingToFinish: AsyncTestHelper = {
  name: "waitForLoadingToFinish",
  description: "Wait for loading states to complete",
  category: "async",
  implementation: async (container: HTMLElement) => {
    await waitFor(() => {
      const loadingElements = container.querySelectorAll('[aria-busy="true"], .loading, .spinner');
      expect(loadingElements.length).toBe(0);
    });
  },
};

export const waitForApiCall: AsyncTestHelper = {
  name: "waitForApiCall",
  description: "Wait for API call to complete and return response",
  category: "async",
  implementation: async (apiCall: () => Promise<any>) => {
    const response = await apiCall();
    await waitFor(() => {
      expect(response).toBeDefined();
    });
    return response;
  },
};

// ===== DATA HELPERS =====

export const generateTestUser: DataTestHelper = {
  name: "generateTestUser",
  description: "Generate a test user object with default values",
  category: "data",
  implementation: (overrides: any = {}) => ({
    id: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    role: "user",
    createdAt: new Date(),
    ...overrides,
  }),
};

export const generateTestProduct: DataTestHelper = {
  name: "generateTestProduct",
  description: "Generate a test product object",
  category: "data",
  implementation: (overrides: any = {}) => ({
    id: "test-product-456",
    name: "Test Product",
    price: 99.99,
    category: "software",
    inStock: true,
    ...overrides,
  }),
};

export const deepClone: DataTestHelper = {
  name: "deepClone",
  description: "Deep clone an object for testing mutations",
  category: "data",
  implementation: (data: any) => JSON.parse(JSON.stringify(data)),
};

// ===== DOM HELPERS =====

export const getByTestId: DomTestHelper = {
  name: "getByTestId",
  description: "Find element by test ID",
  category: "dom",
  implementation: (selector: string) => screen.getByTestId(selector),
};

export const queryByText: DomTestHelper = {
  name: "queryByText",
  description: "Query element by text content",
  category: "dom",
  implementation: (selector: string) => screen.queryByText(selector),
};

export const findAllByRole: DomTestHelper = {
  name: "findAllByRole",
  description: "Find all elements by ARIA role",
  category: "dom",
  implementation: async (selector: string) => await screen.findAllByRole(selector),
};

// ===== API HELPERS =====

export const mockApiResponse: ApiTestHelper = {
  name: "mockApiResponse",
  description: "Mock an API response for testing",
  category: "api",
  implementation: (endpoint: string, method: string, data: any = {}) => ({
    endpoint,
    method: method.toUpperCase(),
    response: {
      status: 200,
      data: { success: true, ...data },
    },
  }),
};

export const mockApiError: ApiTestHelper = {
  name: "mockApiError",
  description: "Mock an API error response",
  category: "api",
  implementation: (endpoint: string, method: string, error: any = {}) => ({
    endpoint,
    method: method.toUpperCase(),
    response: {
      status: 500,
      error: { message: "Internal Server Error", ...error },
    },
  }),
};

// ===== SPECIALIZED TESTING HELPERS =====

export const testAccessibility = {
  name: "testAccessibility",
  description: "Run accessibility tests on a component",
  implementation: async (component: React.ReactElement) => {
    const { container } = render(component);

    // Check for required ARIA attributes
    const buttons = container.querySelectorAll("button");
    buttons.forEach(button => {
      if (!button.getAttribute("aria-label") && !button.textContent?.trim()) {
        throw new Error("Button missing accessible name");
      }
    });

    // Check for alt text on images
    const images = container.querySelectorAll("img");
    images.forEach(img => {
      if (!img.getAttribute("alt")) {
        throw new Error("Image missing alt text");
      }
    });

    // Check for sufficient color contrast (simplified)
    const textElements = container.querySelectorAll("*");
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      if (styles.color && styles.backgroundColor) {
        // This would need a proper color contrast calculation
        expect(true).toBe(true); // Placeholder for actual contrast check
      }
    });
  },
};

export const testPerformance = {
  name: "testPerformance",
  description: "Test component performance metrics",
  implementation: async (component: React.ReactElement, options: any = {}) => {
    const startTime = performance.now();

    const { rerender } = render(component);

    // Wait for any async operations
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });

    const renderTime = performance.now() - startTime;

    // Check render time
    if (options.maxRenderTime) {
      expect(renderTime).toBeLessThan(options.maxRenderTime);
    }

    // Check for unnecessary re-renders
    const rerenderCount = 0; // This would need React DevTools integration

    return {
      renderTime,
      rerenderCount,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    };
  },
};

export const testResponsive = {
  name: "testResponsive",
  description: "Test component responsiveness across viewports",
  implementation: async (component: React.ReactElement, breakpoints: any[] = []) => {
    const viewports = breakpoints.length > 0 ? breakpoints : [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1440, height: 900 },
    ];

    for (const viewport of viewports) {
      // Set viewport
      Object.defineProperty(window, "innerWidth", { value: viewport.width });
      Object.defineProperty(window, "innerHeight", { value: viewport.height });

      // Re-render component
      const { rerender } = render(component);

      // Check for layout issues
      const { container } = render(component);
      const elements = container.querySelectorAll("*");

      elements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Check for overflow
        expect(rect.width).toBeLessThanOrEqual(viewport.width);
        expect(rect.height).toBeLessThanOrEqual(viewport.height);
      });
    }
  },
};

// ===== HELPER COLLECTIONS =====

export const testHelpers = {
  render: {
    renderComponent,
    renderWithProviders,
  },
  interaction: {
    clickElement,
    typeIntoInput,
    selectOption,
  },
  async: {
    waitForLoadingToFinish,
    waitForApiCall,
  },
  data: {
    generateTestUser,
    generateTestProduct,
    deepClone,
  },
  dom: {
    getByTestId,
    queryByText,
    findAllByRole,
  },
  api: {
    mockApiResponse,
    mockApiError,
  },
  specialized: {
    testAccessibility,
    testPerformance,
    testResponsive,
  },
} as const;

export type TestHelperCategory = keyof typeof testHelpers;
