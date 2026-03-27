import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1117",
          color: "#f8fafc",
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: "-0.08em"
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)"
          }}
        >
          N
        </div>
      </div>
    ),
    size
  );
}
