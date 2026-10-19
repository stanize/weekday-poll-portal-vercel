import { ImageResponse } from "next/og";

export const alt = "Games Polls";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DOTS = [
  [0, 0], [2, 0],
  [1, 1],
  [0, 2], [2, 2],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 72,
          background: "#0a0a0a",
          color: "#ededed",
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 40,
            background: "#ededed",
            display: "flex",
            flexWrap: "wrap",
            padding: 36,
            position: "relative",
          }}
        >
          {DOTS.map(([x, y]) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: 36 + x * 72,
                top: 36 + y * 72,
                width: 48,
                height: 48,
                borderRadius: 24,
                background: "#0a0a0a",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.05 }}>Games</div>
          <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.05, color: "#22c55e" }}>Polls</div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#a1a1aa" }}>
            Pick the days you can make it
          </div>
        </div>
      </div>
    ),
    size
  );
}
