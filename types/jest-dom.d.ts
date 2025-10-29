import "@testing-library/jest-dom";

// Augment the Jest matchers with jest-dom
declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string | RegExp | number): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text?: string | RegExp): R;
    }
  }
}

export {};
