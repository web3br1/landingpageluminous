import React from "react";

export default function MockPricing() {
  return (
    <section className="pricing-section py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">[MOCK] Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">[MOCK] Starter</h3>
            <div className="text-3xl font-bold mb-4">[MOCK] $29<span className="text-lg font-normal">/month</span></div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ [MOCK] Up to 1,000 users</li>
              <li>✓ [MOCK] Basic analytics</li>
              <li>✓ [MOCK] Email support</li>
            </ul>
          </div>
          <div className="bg-blue-600 text-white p-8 rounded-xl shadow-lg relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              [MOCK] Most Popular
            </div>
            <h3 className="text-xl font-semibold mb-4">[MOCK] Professional</h3>
            <div className="text-3xl font-bold mb-4">[MOCK] $99<span className="text-lg font-normal">/month</span></div>
            <ul className="space-y-2">
              <li>✓ [MOCK] Up to 10,000 users</li>
              <li>✓ [MOCK] Advanced analytics</li>
              <li>✓ [MOCK] Priority support</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">[MOCK] Enterprise</h3>
            <div className="text-3xl font-bold mb-4">[MOCK] Custom</div>
            <ul className="space-y-2 text-gray-600">
              <li>✓ [MOCK] Unlimited users</li>
              <li>✓ [MOCK] Custom integrations</li>
              <li>✓ [MOCK] Dedicated support</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
