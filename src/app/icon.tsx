import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Die face: five pips on a dark rounded square.
const PIPS = [
  [0, 0], [2, 0],
  [1, 1],
  [0, 2], [2, 2],
];

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
          background: "#0a0a0a",
          borderRadius: 112,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 80,
            background: "#ededed",
            display: "flex",
            position: "relative",
          }}
        >
          {PIPS.map(([x, y]) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: 62 + x * 108,
                top: 62 + y * 108,
                width: 74,
                height: 74,
                borderRadius: 37,
                background: "#0a0a0a",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  );
}
