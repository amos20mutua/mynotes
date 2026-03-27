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
          background: "radial-gradient(circle at 30% 24%, rgba(122, 162, 247, 0.22), transparent 34%), radial-gradient(circle at 72% 70%, rgba(238, 187, 92, 0.18), transparent 30%), #090c14"
        }}
      >
        <div
          style={{
            width: 336,
            height: 336,
            borderRadius: 108,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "2px solid rgba(255,255,255,0.1)",
            background: "rgba(8, 12, 24, 0.84)",
            boxShadow: "0 36px 96px rgba(0,0,0,0.42)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 26,
              borderRadius: 88,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
            }}
          />
          <div
            style={{
              position: "relative",
              width: 176,
              height: 176,
              borderRadius: 999,
              border: "2px solid rgba(177, 208, 232, 0.38)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset"
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 86,
                top: -6,
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "#efbf6f",
                boxShadow: "0 0 24px rgba(239,191,111,0.45)"
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 18,
                top: 54,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: "#8ab9d6",
                boxShadow: "0 0 20px rgba(138,185,214,0.38)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 28,
                bottom: 34,
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#73b5a8",
                boxShadow: "0 0 18px rgba(115,181,168,0.34)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 95,
                top: 12,
                width: 2,
                height: 72,
                transform: "rotate(28deg)",
                transformOrigin: "top center",
                background: "rgba(239,191,111,0.5)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 46,
                top: 112,
                width: 94,
                height: 2,
                transform: "rotate(-18deg)",
                transformOrigin: "left center",
                background: "rgba(138,185,214,0.34)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 36,
                top: 88,
                width: 2,
                height: 54,
                transform: "rotate(26deg)",
                transformOrigin: "top center",
                background: "rgba(115,181,168,0.34)"
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
