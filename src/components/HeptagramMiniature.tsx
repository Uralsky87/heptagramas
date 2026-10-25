/** Non-interactive preview: no dictionary load, session creation or storage. */
export default function HeptagramMiniature({ center, outer }: { center: string; outer: string[] }) {
  const ring = (radius: number) => Array.from({ length: 6 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 3;
    return [60 + radius * Math.cos(angle), 60 + radius * Math.sin(angle)];
  });
  const points = (corners: number[][]) => corners.map((point) => point.join(',')).join(' ');
  const inner = ring(23);
  const rim = ring(50);
  return (
    <svg className="daily-miniature" viewBox="0 0 120 120" aria-hidden="true">
      {outer.slice(0, 6).map((letter, index) => {
        const next = (index + 1) % 6;
        const corners = [inner[index], rim[index], rim[next], inner[next]];
        const x = corners.reduce((sum, point) => sum + point[0], 0) / 4;
        const y = corners.reduce((sum, point) => sum + point[1], 0) / 4;
        return (
          <g key={letter}>
            <polygon className="miniature-outer" points={points(corners.map(([px, py]) => [x + (px - x) * .9, y + (py - y) * .9]))} />
            <text x={x} y={y + 3}>{letter.toUpperCase()}</text>
          </g>
        );
      })}
      <polygon className="miniature-center" points={points(ring(20))} />
      <text x="60" y="64">{center.toUpperCase()}</text>
    </svg>
  );
}
