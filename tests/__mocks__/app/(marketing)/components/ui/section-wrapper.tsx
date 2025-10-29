import React from "react";

export const SectionWrapper = ({ children, ...props }: any) => (
  <section {...props}>{children}</section>
);

export const SectionHeader = ({ title, subtitle, ...props }: any) => (
  <div {...props}>
    {title ? <h2>{title}</h2> : null}
    {subtitle ? <p>{subtitle}</p> : null}
  </div>
);
