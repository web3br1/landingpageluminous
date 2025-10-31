/**
 * Mock Heavy Component for testing lazy loading
 */
import React from 'react';

export const HeavyComponent: React.FC = () => {
  return (
    <div className="heavy-component">
      <h2>Heavy Component</h2>
      <p>This is a heavy component that should be lazy loaded.</p>
    </div>
  );
};

export default HeavyComponent;
