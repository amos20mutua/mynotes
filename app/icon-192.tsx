import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192
};

export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 24%, rgba(127,156,182,0.22), transparent 34%), radial-gradient(circle at 74% 24%, rgba(114,168,155,0.16), transparent 26%), radial-gradient(circle at 50% 88%, rgba(239,191,111,0.16), transparent 24%), #090c14"
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
            background: "rgba(8, 12, 24, 0.84)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.42)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: 34,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
            }}
          />

          <div
            style={{
              position: "relative",
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 26,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))"
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 12,
                top: 10,
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#7f9cb6"
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 13,
                top: 14,
                width: 9,
                height: 9,
                borderRadius: 999,
                background: "#72a89b"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 8,
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#efbf6f"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 18,
                top: 17,
                width: 48,
                height: 4,
                transform: "rotate(63deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "rgba(138,163,185,0.28)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 42,
                top: 58,
                width: 28,
                height: 4,
                transform: "rotate(-55deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "rgba(138,163,185,0.28)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 21,
                top: 16,
                width: 31,
                height: 8,
                transform: "rotate(62deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "linear-gradient(90deg, #f5d38a, #d9a64d)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 39,
                top: 56,
                width: 26,
                height: 8,
                transform: "rotate(-57deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "linear-gradient(90deg, #efbf6f, #d9a64d)"
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
