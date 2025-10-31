/**
 * Network Failure Integration - Real Components Tests
 *
 * Testa falhas de rede em componentes reais da aplicação
 * Foca em comportamentos end-to-end com cenários realistas
 */

import React, { useState, useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { Boundary } from "@/lib/error/Boundary";

// Setup jsdom for React rendering tests
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
let mockOnlineStatus = true;
Object.defineProperty(navigator, "onLine", {
  get: () => mockOnlineStatus,
  configurable: true,
});

// Network utilities
const simulateOffline = () => {
  mockOnlineStatus = false;
  window.dispatchEvent(new Event("offline"));
};

const simulateOnline = () => {
  mockOnlineStatus = true;
  window.dispatchEvent(new Event("online"));
};

describe("Network Failure Integration - Real Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnlineStatus = true;

    // Default successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Hero Section with Network Dependencies", () => {
    // Realistic hero component that fetches dynamic content
    const HeroWithDynamicContent = ({
      section = "hero",
    }: {
      section?: string;
    }) => {
      const [content, setContent] = useState<any>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        const fetchContent = async () => {
          try {
            const response = await fetch(`/api/content/${section}`);
            if (!response.ok) {
              throw new Error(`Failed to load ${section} content`);
            }
            const data = await response.json();
            setContent(data);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        };

        fetchContent();
      }, [section]);

      if (loading) {
        return (
          <section data-testid="hero-loading">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </section>
        );
      }

      if (error) {
        throw new Error(error);
      }

      return (
        <section data-testid="hero-content">
          <h1>{content?.headline || "Default Headline"}</h1>
          <p>{content?.subheadline || "Default subheadline"}</p>
          <button data-testid="cta-button">
            {content?.ctaText || "Get Started"}
          </button>
        </section>
      );
    };

    it("should render hero with network failure gracefully", async () => {
      // Mock network failure
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      render(
        <ThemeProvider
          defaultTheme={{
            mode: "light",
            colorScheme: "default",
            reducedMotion: false,
          }}
        >
          <Boundary section="hero">
            <HeroWithDynamicContent />
          </Boundary>
        </ThemeProvider>,
      );

      // Shows loading initially
      expect(screen.getByTestId("hero-loading")).toBeInTheDocument();

      // Then shows error boundary
      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      expect(screen.getByText("Network timeout")).toBeInTheDocument();
    });

    it("should recover from network failure after retry", async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Connection lost"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              headline: "Welcome Back",
              subheadline: "Connection restored",
              ctaText: "Continue",
            }),
        });

      render(
        <ThemeProvider
          defaultTheme={{
            mode: "light",
            colorScheme: "default",
            reducedMotion: false,
          }}
        >
          <Boundary section="hero" maxRetries={1}>
            <HeroWithDynamicContent />
          </Boundary>
        </ThemeProvider>,
      );

      // Shows loading then error
      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByTestId("retry-button");
      await act(async () => {
        fireEvent.click(retryButton);
      });

      // Should recover and show content
      await waitFor(() => {
        expect(screen.getByTestId("hero-content")).toBeInTheDocument();
      });

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });
  });

  describe("Features Section with API Dependencies", () => {
    // Features component that loads feature data from API
    const FeaturesWithApiData = () => {
      const [features, setFeatures] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        const fetchFeatures = async () => {
          try {
            const response = await fetch("/api/features");
            if (!response.ok) {
              throw new Error("Failed to load features");
            }
            const data = await response.json();
            setFeatures(data.features || []);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        };

        fetchFeatures();
      }, []);

      if (loading) {
        return (
          <section data-testid="features-loading">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      if (error) {
        throw new Error(error);
      }

      return (
        <section data-testid="features-content">
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature: any, index: number) => (
              <div key={index} data-testid={`feature-${index}`}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      );
    };

    it("should handle server errors in features API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      render(
        <Boundary section="features">
          <FeaturesWithApiData />
        </Boundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      expect(screen.getByText("Failed to load features")).toBeInTheDocument();
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      render(
        <Boundary section="features">
          <FeaturesWithApiData />
        </Boundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });
    });

    it("should render features successfully with valid data", async () => {
      const mockFeatures = [
        { title: "Fast", description: "Lightning quick" },
        { title: "Secure", description: "Bank-level security" },
        { title: "Scalable", description: "Grows with you" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ features: mockFeatures }),
      });

      render(<FeaturesWithApiData />);

      await waitFor(() => {
        expect(screen.getByTestId("features-content")).toBeInTheDocument();
      });

      expect(screen.getByText("Fast")).toBeInTheDocument();
      expect(screen.getByText("Secure")).toBeInTheDocument();
      expect(screen.getByText("Scalable")).toBeInTheDocument();
    });
  });

  describe("Pricing Section with Payment API", () => {
    // Pricing component that checks payment status
    const PricingWithPaymentCheck = () => {
      const [plans, setPlans] = useState<any[]>([]);
      const [userPlan, setUserPlan] = useState<string | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        const fetchPricingData = async () => {
          try {
            // Fetch plans
            const plansResponse = await fetch("/api/plans");
            if (!plansResponse.ok) {
              throw new Error("Failed to load pricing plans");
            }
            const plansData = await plansResponse.json();

            // Fetch user plan (might fail if not logged in)
            try {
              const userResponse = await fetch("/api/user/plan");
              if (userResponse.ok) {
                const userData = await userResponse.json();
                setUserPlan(userData.plan);
              }
            } catch (userError) {
              // User plan fetch is optional, don't fail completely
              console.warn("Could not fetch user plan:", userError);
            }

            setPlans(plansData.plans || []);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        };

        fetchPricingData();
      }, []);

      if (loading) {
        return (
          <section data-testid="pricing-loading">
            <div className="text-center">Loading pricing...</div>
          </section>
        );
      }

      if (error) {
        throw new Error(error);
      }

      return (
        <section data-testid="pricing-content">
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan: any, index: number) => (
              <div
                key={index}
                data-testid={`plan-${index}`}
                className={
                  userPlan === plan.id ? "border-2 border-blue-500" : ""
                }
              >
                <h3>{plan.name}</h3>
                <p>${plan.price}/month</p>
                {userPlan === plan.id && (
                  <span data-testid="current-plan">Current Plan</span>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    };

    it("should handle partial failures gracefully", async () => {
      const mockPlans = [
        { id: "basic", name: "Basic", price: 10 },
        { id: "pro", name: "Pro", price: 20 },
        { id: "enterprise", name: "Enterprise", price: 50 },
      ];

      // Plans succeed, user plan fails (user not logged in)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ plans: mockPlans }),
        })
        .mockRejectedValueOnce(new Error("Unauthorized"));

      render(<PricingWithPaymentCheck />);

      await waitFor(() => {
        expect(screen.getByTestId("pricing-content")).toBeInTheDocument();
      });

      // Should show plans but no current plan indicator
      expect(screen.getByText("Basic")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
      expect(screen.queryByTestId("current-plan")).not.toBeInTheDocument();
    });

    it("should fail completely if plans API fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Plans API down"));

      render(
        <Boundary section="pricing">
          <PricingWithPaymentCheck />
        </Boundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      expect(screen.getByText("Plans API down")).toBeInTheDocument();
    });
  });

  describe("Contact Form with Submission Failures", () => {
    // Contact form component with network submission
    const ContactFormWithNetwork = () => {
      const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
      });
      const [submitting, setSubmitting] = useState(false);
      const [submitError, setSubmitError] = useState<string | null>(null);
      const [submitted, setSubmitted] = useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          if (!response.ok) {
            throw new Error("Failed to send message");
          }

          setSubmitted(true);
        } catch (err) {
          setSubmitError((err as Error).message);
        } finally {
          setSubmitting(false);
        }
      };

      const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      };

      if (submitted) {
        return (
          <div data-testid="contact-success">
            <h3>Thank you!</h3>
            <p>Your message has been sent.</p>
          </div>
        );
      }

      return (
        <form onSubmit={handleSubmit} data-testid="contact-form">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            data-testid="name-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            data-testid="email-input"
          />
          <textarea
            placeholder="Message"
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            data-testid="message-input"
          />
          <button
            type="submit"
            disabled={submitting}
            data-testid="submit-button"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
          {submitError && (
            <div data-testid="submit-error" className="text-red-500">
              {submitError}
            </div>
          )}
        </form>
      );
    };

    it("should handle form submission network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Submission failed"));

      render(<ContactFormWithNetwork />);

      // Fill form
      fireEvent.change(screen.getByTestId("name-input"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("message-input"), {
        target: { value: "Test message" },
      });

      // Submit
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("submit-error")).toBeInTheDocument();
      });

      expect(screen.getByText("Submission failed")).toBeInTheDocument();
    });

    it("should handle server validation errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid email format" }),
      });

      render(<ContactFormWithNetwork />);

      // Fill form with invalid data
      fireEvent.change(screen.getByTestId("name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "invalid-email" },
      });
      fireEvent.change(screen.getByTestId("message-input"), {
        target: { value: "Test" },
      });

      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("submit-error")).toBeInTheDocument();
      });
    });

    it("should succeed with valid submission", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      render(<ContactFormWithNetwork />);

      // Fill form
      fireEvent.change(screen.getByTestId("name-input"), {
        target: { value: "Jane Doe" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(screen.getByTestId("message-input"), {
        target: { value: "Hello world" },
      });

      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("contact-success")).toBeInTheDocument();
      });

      expect(screen.getByText("Thank you!")).toBeInTheDocument();
    });
  });

  describe("Offline/Online State Transitions", () => {
    // Component that shows different content based on online status
    const OnlineStatusAwareComponent = () => {
      const [isOnline, setIsOnline] = useState(navigator.onLine);
      const [pendingActions, setPendingActions] = useState<any[]>([]);

      useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      }, []);

      const performAction = async () => {
        if (!isOnline) {
          // Queue for later
          setPendingActions((prev) => [
            ...prev,
            { type: "action", timestamp: Date.now() },
          ]);
          return;
        }

        try {
          await fetch("/api/action");
        } catch (err) {
          // Handle error
        }
      };

      return (
        <div data-testid="online-aware-component">
          <div data-testid="status">
            {isOnline ? "🟢 Online" : "🔴 Offline"}
          </div>
          <div data-testid="queue-count">Pending: {pendingActions.length}</div>
          <button onClick={performAction} data-testid="action-button">
            Perform Action
          </button>
        </div>
      );
    };

    it("should queue actions when offline", () => {
      simulateOffline();
      render(<OnlineStatusAwareComponent />);

      expect(screen.getByText("🔴 Offline")).toBeInTheDocument();
      expect(screen.getByText("Pending: 0")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("action-button"));

      expect(screen.getByText("Pending: 1")).toBeInTheDocument();
    });

    it("should transition from offline to online", () => {
      simulateOffline();
      render(<OnlineStatusAwareComponent />);

      expect(screen.getByText("🔴 Offline")).toBeInTheDocument();

      act(() => {
        simulateOnline();
      });

      expect(screen.getByText("🟢 Online")).toBeInTheDocument();
    });

    it("should handle online/offline transitions during component lifecycle", () => {
      render(<OnlineStatusAwareComponent />);

      expect(screen.getByText("🟢 Online")).toBeInTheDocument();

      // Go offline
      act(() => {
        simulateOffline();
      });

      expect(screen.getByText("🔴 Offline")).toBeInTheDocument();

      // Try action while offline
      fireEvent.click(screen.getByTestId("action-button"));
      expect(screen.getByText("Pending: 1")).toBeInTheDocument();

      // Come back online
      act(() => {
        simulateOnline();
      });

      expect(screen.getByText("🟢 Online")).toBeInTheDocument();
      expect(screen.getByText("Pending: 1")).toBeInTheDocument(); // Still queued
    });
  });
});
