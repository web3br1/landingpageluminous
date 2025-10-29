import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Boundary } from "@/lib/error/Boundary";

// Mock components that throw errors
const ErrorComponent = () => {
  throw new Error("Test component error");
};

const ValidComponent = () => <div>Valid Component</div>;

describe("Error Boundaries", () => {
  it("should render error boundary when component throws error", () => {
    const mockOnError = vi.fn();

    render(
      <Boundary onError={mockOnError}>
        <ErrorComponent />
      </Boundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test component error")).toBeInTheDocument();
    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object),
    );
  });

  it("should render component when no error occurs", () => {
    render(
      <Boundary>
        <ValidComponent />
      </Boundary>,
    );

    expect(screen.getByText("Valid Component")).toBeInTheDocument();
  });

  it("should show retry button and handle retries", async () => {
    const mockOnError = vi.fn();

    render(
      <Boundary onError={mockOnError} maxRetries={2}>
        <ErrorComponent />
      </Boundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test component error")).toBeInTheDocument();
    expect(screen.getByText("Try again (2 attempts left)")).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByTestId("retry-button");
    await act(async () => {
      retryButton.click();
    });

    // Should show updated retry count
    expect(screen.getByText("Try again (1 attempts left)")).toBeInTheDocument();
  });

  it("should hide retry button when max retries reached", () => {
    render(
      <Boundary maxRetries={0}>
        <ErrorComponent />
      </Boundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByTestId("retry-button")).not.toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    const customFallback = (error: Error, retry: () => void) => (
      <div data-testid="custom-fallback">
        <h3>Custom Error: {error.message}</h3>
        <button onClick={retry} data-testid="custom-retry">
          Retry Custom
        </button>
      </div>
    );

    render(
      <Boundary fallback={customFallback}>
        <ErrorComponent />
      </Boundary>,
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(
      screen.getByText("Custom Error: Test component error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("custom-retry")).toBeInTheDocument();
  });

  it("should handle reload button", () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <Boundary>
        <ErrorComponent />
      </Boundary>,
    );

    const reloadButton = screen.getByTestId("reload-button");
    reloadButton.click();

    expect(mockReload).toHaveBeenCalled();
  });
});
