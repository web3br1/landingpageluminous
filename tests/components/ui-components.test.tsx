import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";

// Mock some basic UI components for testing
const MockButton = ({ children, onClick, disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button onClick={onClick} disabled={disabled} data-testid="mock-button">
    {children}
  </button>
);

const MockInput = ({ value, onChange, placeholder }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    data-testid="mock-input"
  />
);

const MockCard = ({ children, title }: {
  children: React.ReactNode;
  title?: string;
}) => (
  <div data-testid="mock-card">
    {title && <h3 data-testid="card-title">{title}</h3>}
    <div data-testid="card-content">{children}</div>
  </div>
);

const CounterComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div data-testid="counter-display">{count}</div>
      <MockButton onClick={() => setCount(c => c + 1)}>
        Increment
      </MockButton>
      <MockButton onClick={() => setCount(c => c - 1)}>
        Decrement
      </MockButton>
      <MockButton onClick={() => setCount(0)}>
        Reset
      </MockButton>
    </div>
  );
};

const FormComponent = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <MockCard title="Submission Success">
        <p data-testid="submitted-name">Name: {name}</p>
        <p data-testid="submitted-email">Email: {email}</p>
      </MockCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="test-form">
      <MockInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />
      <MockInput
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <MockButton type="submit">Submit</MockButton>
    </form>
  );
};

describe("UI Components Tests", () => {
  describe("MockButton", () => {
    it("should render with children", () => {
      render(<MockButton>Click me</MockButton>);
      expect(screen.getByTestId("mock-button")).toHaveTextContent("Click me");
    });

    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<MockButton onClick={handleClick}>Click me</MockButton>);

      fireEvent.click(screen.getByTestId("mock-button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when disabled prop is true", () => {
      const handleClick = vi.fn();
      render(<MockButton onClick={handleClick} disabled>Disabled</MockButton>);

      const button = screen.getByTestId("mock-button");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("MockInput", () => {
    it("should render with placeholder", () => {
      render(<MockInput value="" onChange={() => {}} placeholder="Test placeholder" />);
      expect(screen.getByPlaceholderText("Test placeholder")).toBeInTheDocument();
    });

    it("should display value", () => {
      render(<MockInput value="test value" onChange={() => {}} />);
      expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
    });

    it("should call onChange when value changes", () => {
      const handleChange = vi.fn();
      render(<MockInput value="" onChange={handleChange} />);

      fireEvent.change(screen.getByTestId("mock-input"), { target: { value: "new value" } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("MockCard", () => {
    it("should render children", () => {
      render(<MockCard><p>Test content</p></MockCard>);
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      render(<MockCard title="Test Title"><p>Content</p></MockCard>);
      expect(screen.getByTestId("card-title")).toHaveTextContent("Test Title");
      expect(screen.getByTestId("card-content")).toHaveTextContent("Content");
    });
  });

  describe("CounterComponent", () => {
    it("should start with count 0", () => {
      render(<CounterComponent />);
      expect(screen.getByTestId("counter-display")).toHaveTextContent("0");
    });

    it("should increment count", () => {
      render(<CounterComponent />);
      fireEvent.click(screen.getByText("Increment"));
      expect(screen.getByTestId("counter-display")).toHaveTextContent("1");
    });

    it("should decrement count", () => {
      render(<CounterComponent />);
      fireEvent.click(screen.getByText("Increment"));
      fireEvent.click(screen.getByText("Increment"));
      fireEvent.click(screen.getByText("Decrement"));
      expect(screen.getByTestId("counter-display")).toHaveTextContent("1");
    });

    it("should reset count", () => {
      render(<CounterComponent />);
      fireEvent.click(screen.getByText("Increment"));
      fireEvent.click(screen.getByText("Increment"));
      fireEvent.click(screen.getByText("Reset"));
      expect(screen.getByTestId("counter-display")).toHaveTextContent("0");
    });
  });

  describe("FormComponent", () => {
    it("should render form initially", () => {
      render(<FormComponent />);
      expect(screen.getByTestId("test-form")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    it("should update name input", () => {
      render(<FormComponent />);
      const nameInput = screen.getByPlaceholderText("Enter name");

      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      expect(nameInput).toHaveValue("John Doe");
    });

    it("should update email input", () => {
      render(<FormComponent />);
      const emailInput = screen.getByPlaceholderText("Enter email");

      fireEvent.change(emailInput, { target: { value: "john@example.com" } });
      expect(emailInput).toHaveValue("john@example.com");
    });

    it("should submit form and show success", () => {
      render(<FormComponent />);

      fireEvent.change(screen.getByPlaceholderText("Enter name"), {
        target: { value: "John Doe" }
      });
      fireEvent.change(screen.getByPlaceholderText("Enter email"), {
        target: { value: "john@example.com" }
      });

      fireEvent.click(screen.getByText("Submit"));

      expect(screen.getByTestId("submitted-name")).toHaveTextContent("Name: John Doe");
      expect(screen.getByTestId("submitted-email")).toHaveTextContent("Email: john@example.com");
    });
  });
});
