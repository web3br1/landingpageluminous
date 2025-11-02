import React from "react";

export default function MockHero() {
  return (
    <section className="hero-section py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">[MOCK] Build Amazing Products</h1>
        <p className="text-xl mb-8 opacity-90">[MOCK] The fastest way to ship software that matters</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          [MOCK] Get Started
        </button>
      </div>
    </section>
  );
}
