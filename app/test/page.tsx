// Test page in different route
export default function TestRoute() {
  console.log(
    "TEST ROUTE: Rendering on",
    typeof window === "undefined" ? "SERVER" : "CLIENT",
  );

  return (
    <div>
      <h1>TEST ROUTE - SSR Works</h1>
      <p>This is a test in /test route.</p>
      <p>Rendered on: {typeof window === "undefined" ? "SERVER" : "CLIENT"}</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
