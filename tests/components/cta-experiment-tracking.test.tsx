import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CTA } from "@/app/(marketing)/components/ui/cta-button-unified";

// Mock dos hooks
const mockTrackExperimentEvent = vi.fn();
const mockTrackAnalytics = vi.fn();

vi.mock("@/lib/experiments/hooks", () => ({
  useExperimentTracking: vi.fn(() => ({
    trackClick: mockTrackExperimentEvent,
  })),
}));

vi.mock("@/lib/analytics/use-analytics", () => ({
  useAnalytics: vi.fn(() => ({
    trackEvent: mockTrackAnalytics,
  })),
}));

describe("CTA Experiment Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should track experiment click when experiment props are provided", () => {
    render(
      <CTA
        experimentId="hero_test"
        experimentVariant="variant_a"
        onClick={() => {}}
      >
        Test CTA
      </CTA>,
    );

    const button = screen.getByRole("button", { name: /test cta/i });
    fireEvent.click(button);

    expect(mockTrackExperimentEvent).toHaveBeenCalledWith("cta_button", {
      variant: undefined,
      size: undefined,
      href: undefined,
      text: "Test CTA",
    });

    expect(mockTrackAnalytics).toHaveBeenCalledWith(
      "cta_click",
      "click",
      "cta_button",
      undefined,
      {
        variant: undefined,
        size: undefined,
        href: undefined,
        experimentId: "hero_test",
        experimentVariant: "variant_a",
        element: "cta_button",
      },
    );
  });

  it("should not track when trackClick is false", () => {
    render(
      <CTA
        experimentId="hero_test"
        experimentVariant="variant_a"
        trackClick={false}
        onClick={() => {}}
      >
        Test CTA
      </CTA>,
    );

    const button = screen.getByRole("button", { name: /test cta/i });
    fireEvent.click(button);

    expect(mockTrackExperimentEvent).not.toHaveBeenCalled();
    expect(mockTrackAnalytics).not.toHaveBeenCalled();
  });

  it("should not track when loading is true", () => {
    render(
      <CTA
        experimentId="hero_test"
        experimentVariant="variant_a"
        loading={true}
        onClick={() => {}}
      >
        Test CTA
      </CTA>,
    );

    const button = screen.getByRole("button", { name: /test cta/i });
    fireEvent.click(button);

    expect(mockTrackExperimentEvent).not.toHaveBeenCalled();
    expect(mockTrackAnalytics).not.toHaveBeenCalled();
  });

  it("should not track when disabled is true", () => {
    render(
      <CTA
        experimentId="hero_test"
        experimentVariant="variant_a"
        disabled={true}
        onClick={() => {}}
      >
        Test CTA
      </CTA>,
    );

    const button = screen.getByRole("button", { name: /test cta/i });
    fireEvent.click(button);

    expect(mockTrackExperimentEvent).not.toHaveBeenCalled();
    expect(mockTrackAnalytics).not.toHaveBeenCalled();
  });

  it("should track with anchor element", () => {
    render(
      <CTA
        href="/test"
        experimentId="hero_test"
        experimentVariant="variant_a"
        onClick={() => {}}
      >
        Test Link
      </CTA>,
    );

    const link = screen.getByRole("link", { name: /test link/i });
    fireEvent.click(link);

    expect(mockTrackExperimentEvent).toHaveBeenCalledWith("cta_button", {
      variant: undefined,
      size: undefined,
      href: "/test",
      text: "Test Link",
    });

    expect(mockTrackAnalytics).toHaveBeenCalledWith(
      "cta_click",
      "click",
      "cta_button",
      undefined,
      {
        variant: undefined,
        size: undefined,
        href: "/test",
        experimentId: "hero_test",
        experimentVariant: "variant_a",
        element: "cta_button",
      },
    );
  });

  it("should call original onClick handler", () => {
    const mockOnClick = vi.fn();
    render(
      <CTA
        experimentId="hero_test"
        experimentVariant="variant_a"
        onClick={mockOnClick}
      >
        Test CTA
      </CTA>,
    );

    const button = screen.getByRole("button", { name: /test cta/i });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("should not initialize experiment tracking when no experiment props provided", async () => {
    const { useExperimentTracking } = await import("@/lib/experiments/hooks");
    const mockUseExperimentTracking = vi.mocked(useExperimentTracking);

    render(<CTA onClick={() => {}}>Test CTA</CTA>);

    // useExperimentTracking should not be called when no experiment props
    expect(mockUseExperimentTracking).not.toHaveBeenCalled();
  });
});
