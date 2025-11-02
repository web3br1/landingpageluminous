"use client";

import React from "react";

interface ExperimentDashboardProps {
  experimentId?: string;
  showAllExperiments?: boolean;
}

export function ExperimentDashboard({ experimentId, showAllExperiments }: ExperimentDashboardProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">A/B Testing Dashboard</h2>
      <p className="text-gray-600">
        Experiment dashboard temporarily simplified for build stability.
        <br />
        Experiment ID: {experimentId || "All"}
        <br />
        Show All: {showAllExperiments ? "Yes" : "No"}
      </p>
    </div>
  );
}
