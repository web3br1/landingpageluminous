import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";

const SimpleCounter = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div data-testid="counter">{count}</div>
      <button onClick={() => setCount((c) => c + 1)} data-testid="increment">
        +
      </button>
    </div>
  );
};

describe("Simple Test", () => {
  it("should render counter", () => {
    render(<SimpleCounter />);
    expect(screen.getByTestId("counter")).toHaveTextContent("0");
  });

  it("should increment counter", () => {
    render(<SimpleCounter />);
    fireEvent.click(screen.getByTestId("increment"));
    expect(screen.getByTestId("counter")).toHaveTextContent("1");
  });
});
