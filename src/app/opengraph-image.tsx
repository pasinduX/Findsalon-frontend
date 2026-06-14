import { ImageResponse } from "next/og";
import { siteName } from "@/lib/seo";

export const alt = `${siteName} salon booking platform`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #111827 0%, #0f766e 52%, #f59e0b 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 2, textTransform: "uppercase", opacity: 0.86 }}>
          Sri Lanka salon booking
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, marginTop: 28 }}>{siteName}</div>
        <div style={{ fontSize: 42, marginTop: 28, maxWidth: 860, lineHeight: 1.18 }}>
          Find salons, compare services, and book appointments online.
        </div>
      </div>
    ),
    size
  );
}
