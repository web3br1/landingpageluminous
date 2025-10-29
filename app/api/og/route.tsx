import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title =
      searchParams.get("title") ||
      "DataFlow — Relatórios automáticos em minutos";
    const description =
      searchParams.get("description") ||
      "Automatize seus relatórios e tenha dashboards executivos em tempo real";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1e40af", // blue-700
            backgroundImage:
              "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            fontSize: 32,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            padding: "40px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "20px",
              lineHeight: "1.2",
              maxWidth: "900px",
            }}
          >
            DataFlow
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "400",
              opacity: 0.9,
              lineHeight: "1.4",
              maxWidth: "800px",
            }}
          >
            {description}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "40px",
              fontSize: "16px",
              opacity: 0.7,
            }}
          >
            dataflow.com.br
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
