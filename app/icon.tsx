import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 192,
          fontWeight: 700,
          letterSpacing: "-0.08em"
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)"
          }}
        >
          N
        </div>
      </div>
    ),
    size
  );
}
