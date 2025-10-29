// Quick debug test
const React = require("react");
const { render } = require("@testing-library/react");

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) =>
    React.createElement("img", { src, alt, ...props }),
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...classes) => classes.filter(Boolean).join(" "),
}));

const mockContent = {
  title: "Test Title",
  subtitle: "Test Subtitle",
  layout: "full",
  showRatings: true,
  testimonials: [
    {
      quote: "Esta solução transformou completamente nosso workflow!",
      author: {
        name: "João Silva",
        role: "CTO",
        company: "TechCorp",
        avatar: "/avatars/joao.jpg",
      },
      rating: 5,
    },
  ],
};

describe("Debug Test", () => {
  it("should render basic component", () => {
    const SocialProof =
      require("./components/sections/social-proof/social-proof").SocialProof;
    const result = render(
      React.createElement(SocialProof, { content: mockContent }),
    );
    console.log("Rendered HTML:", result.container.innerHTML);
    expect(result.container).toBeTruthy();
  });
});
