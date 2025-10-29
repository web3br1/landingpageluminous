// SSR Test Page - Isolated test
export default function SSRTestPage() {
  const timestamp = new Date().toISOString();
  const isServer = typeof window === "undefined";

  console.log(
    "SSR TEST PAGE: Rendering on",
    isServer ? "SERVER" : "CLIENT",
    "at",
    timestamp,
  );

  return (
    <div style={{ padding: "20px", border: "2px solid red", margin: "20px" }}>
      <h1>🚀 SSR TEST PAGE</h1>
      <p>
        <strong>Rendered on:</strong> {isServer ? "SERVER ✅" : "CLIENT ⚠️"}
      </p>
      <p>
        <strong>Timestamp:</strong> {timestamp}
      </p>
      <p>
        <strong>Environment:</strong> {process.env.NODE_ENV || "unknown"}
      </p>
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "10px",
          margin: "10px 0",
        }}
      >
        If you see this content in the initial HTML response, SSR is working!
      </div>
    </div>
  );
}
