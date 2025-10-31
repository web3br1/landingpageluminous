import React from "react";

export default function MockFeatures() {
  return (
    <section className="features-section py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">[MOCK] Everything You Need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: "🚀", title: "[MOCK] Fast Setup", desc: "[MOCK] Get started in minutes, not hours" },
            { icon: "📊", title: "[MOCK] Real-time Analytics", desc: "[MOCK] Track performance as it happens" },
            { icon: "🔒", title: "[MOCK] Enterprise Security", desc: "[MOCK] Bank-level security you can trust" },
            { icon: "🎯", title: "[MOCK] Smart Automation", desc: "[MOCK] Automate repetitive tasks" },
            { icon: "📱", title: "[MOCK] Mobile First", desc: "[MOCK] Optimized for all devices" },
            { icon: "💬", title: "[MOCK] 24/7 Support", desc: "[MOCK] Help when you need it most" }
          ].map((feature, index) => (
            <div key={index} className="text-center p-6">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
