import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
          fontSize: 108,
          fontWeight: 700,
          fontFamily: "sans-serif",
          borderRadius: 42,
        }}
      >
        G
      </div>
    ),
    { width: 192, height: 192 }
  );
}
