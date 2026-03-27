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
          background: "radial-gradient(circle at 30% 24%, rgba(122, 162, 247, 0.18), transparent 34%), radial-gradient(circle at 72% 70%, rgba(238, 187, 92, 0.14), transparent 30%), #090c14"
        }}
      >
        <div
          style={{
            width: 136,
            height: 136,
            borderRadius: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "2px solid rgba(255,255,255,0.1)",
            background: "rgba(8, 12, 24, 0.84)"
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: "2px solid rgba(177, 208, 232, 0.34)",
              position: "relative"
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 32,
                top: -4,
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#efbf6f"
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 8,
                top: 24,
                width: 9,
                height: 9,
                borderRadius: 999,
                background: "#8ab9d6"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 12,
                bottom: 12,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#73b5a8"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 36,
                top: 3,
                width: 2,
                height: 30,
                transform: "rotate(28deg)",
                transformOrigin: "top center",
                background: "rgba(239,191,111,0.45)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 45,
                width: 38,
                height: 2,
                transform: "rotate(-18deg)",
                transformOrigin: "left center",
                background: "rgba(138,185,214,0.34)"
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
