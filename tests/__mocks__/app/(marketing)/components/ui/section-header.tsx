import React from "react";

export const SectionHeader = ({ title, subtitle, ...props }: any) => (
  <div {...props}>
    <h2>{title}</h2>
    {subtitle ? <p>{subtitle}</p> : null}
  </div>
);
