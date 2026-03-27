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
          background:
            "radial-gradient(circle at 30% 24%, rgba(127,156,182,0.22), transparent 34%), radial-gradient(circle at 74% 24%, rgba(114,168,155,0.16), transparent 26%), radial-gradient(circle at 50% 88%, rgba(239,191,111,0.16), transparent 24%), #090c14"
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
              width: 196,
              height: 196,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 56,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset"
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 28,
                width: 26,
                height: 26,
                borderRadius: 999,
                background: "#7f9cb6",
                boxShadow: "0 0 24px rgba(127,156,182,0.32)"
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 34,
                top: 34,
                width: 20,
                height: 20,
                borderRadius: 999,
                background: "#72a89b",
                boxShadow: "0 0 20px rgba(114,168,155,0.28)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 92,
                bottom: 22,
                width: 22,
                height: 22,
                borderRadius: 999,
                background: "#efbf6f",
                boxShadow: "0 0 18px rgba(239,191,111,0.38)"
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 43,
                top: 39,
                width: 114,
                height: 8,
                transform: "rotate(63deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "rgba(138,163,185,0.28)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 101,
                top: 143,
                width: 72,
                height: 8,
                transform: "rotate(-55deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "rgba(138,163,185,0.28)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 52,
                top: 36,
                width: 72,
                height: 14,
                transform: "rotate(62deg)",
                transformOrigin: "left center",
                borderRadius: 999,
                background: "linear-gradient(90deg, #f5d38a, #d9a64d)"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 97,
                top: 137,
                width: 60,
                height: 14,
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
