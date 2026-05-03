import { useState, forwardRef, useImperativeHandle } from 'react';

interface HeptagramBoardSvgProps {
  center: string;
  outer: string[];
  onLetterClick?: (letter: string) => void;
  successAnimation?: boolean;
  onShuffleOuter?: (shuffled: string[]) => void;
  extraLetterIndices?: Set<number>;
  variant?: 'default' | 'mothers-day';
}

const SVG_SIZE = 300;
const CENTER_X = 150;
const CENTER_Y = 150;
const POLYGON_RADIUS = 66;
const g = 6;
const depth = 55;
const t = g * 0.6;

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function getPolygonPoints(n: number, radius: number) {
  const angleStep = 360 / n;
  const startAngle = -90;
  const angles = Array.from({ length: n }, (_, i) => startAngle + i * angleStep);
  return angles.map((angle) => polarToCartesian(CENTER_X, CENTER_Y, radius, angle));
}

function lerp(p1: { x: number; y: number }, p2: { x: number; y: number }, tValue: number) {
  return {
    x: p1.x + (p2.x - p1.x) * tValue,
    y: p1.y + (p2.y - p1.y) * tValue,
  };
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTrapezoidWithGaps(
  i: number,
  n: number,
  polyInterior: { x: number; y: number }[],
  polyExterior: { x: number; y: number }[]
) {
  const intA = polyInterior[i];
  const intB = polyInterior[(i + 1) % n];
  const Li = distance(intA, intB);
  const extA = polyExterior[i];
  const extB = polyExterior[(i + 1) % n];
  const Lo = distance(extA, extB);

  const innerA = lerp(intA, intB, t / Li);
  const innerB = lerp(intA, intB, 1 - t / Li);
  const outerA = lerp(extA, extB, t / Lo);
  const outerB = lerp(extA, extB, 1 - t / Lo);

  return [innerA, innerB, outerB, outerA];
}

function pointsToString(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function getTrapezoidCenter(points: { x: number; y: number }[]) {
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

export interface HeptagramBoardHandle {
  shuffle: () => void;
}

const HeptagramBoardSvg = forwardRef<HeptagramBoardHandle, HeptagramBoardSvgProps>(({
  center,
  outer,
  onLetterClick,
  successAnimation,
  onShuffleOuter,
  extraLetterIndices,
  variant = 'default',
}, ref) => {
  const [outerLetters, setOuterLetters] = useState(outer);
  const isMothersDay = variant === 'mothers-day';

  const shuffleOuter = () => {
    const shuffled = [...outerLetters];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOuterLetters(shuffled);
    onShuffleOuter?.(shuffled);
  };

  useImperativeHandle(ref, () => ({
    shuffle: shuffleOuter,
  }));

  const centerStart = isMothersDay
    ? '#e84d93'
    : getComputedStyle(document.documentElement).getPropertyValue('--theme-center-start').trim();
  const centerEnd = isMothersDay
    ? '#8b3bb4'
    : getComputedStyle(document.documentElement).getPropertyValue('--theme-center-end').trim();
  const outerStart = isMothersDay
    ? '#f59abb'
    : getComputedStyle(document.documentElement).getPropertyValue('--theme-outer-start').trim();
  const outerEnd = isMothersDay
    ? '#a45cc7'
    : getComputedStyle(document.documentElement).getPropertyValue('--theme-outer-end').trim();

  const n = outerLetters.length;
  const centerPolygonPoints = getPolygonPoints(n, POLYGON_RADIUS);
  const apotema = POLYGON_RADIUS * Math.cos(Math.PI / n);
  const apotemaInterior = apotema + g;
  const radioInterior = apotemaInterior / Math.cos(Math.PI / n);
  const polyInterior = getPolygonPoints(n, radioInterior);
  const apotemaExterior = apotemaInterior + depth;
  const radioExterior = apotemaExterior / Math.cos(Math.PI / n);
  const polyExterior = getPolygonPoints(n, radioExterior);
  const trapezoids = Array.from({ length: n }, (_, i) =>
    getTrapezoidWithGaps(i, n, polyInterior, polyExterior)
  );

  return (
    <div className={`heptagram-section ${isMothersDay ? 'heptagram-section-mothers-day' : ''}`}>
      <div className={`svg-container ${successAnimation ? 'success-bounce' : ''}`}>
        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="heptagram-svg">
          <defs>
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: centerStart, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: centerEnd, stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="trapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: outerStart, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: outerEnd, stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="trapExtraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: lightenColor(outerStart, 0.1), stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: lightenColor(outerEnd, 0.1), stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {trapezoids.map((points, i) => {
            const centerPoint = getTrapezoidCenter(points);
            const isExtra = extraLetterIndices?.has(i) || false;
            const fillGradient = isExtra ? 'url(#trapExtraGradient)' : 'url(#trapGradient)';
            const strokeWidth = isExtra ? 2.5 : 0;
            const strokeColor = isExtra ? outerEnd : 'none';

            return (
              <g key={`trap-${i}`} style={{ cursor: 'pointer' }} onClick={() => onLetterClick?.(outerLetters[i])}>
                <polygon
                  points={pointsToString(points)}
                  fill={fillGradient}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="trap-shape"
                  style={{ filter: `drop-shadow(0 2px 6px ${isMothersDay ? 'rgba(122, 42, 120, 0.28)' : 'rgba(0,0,0,0.2)'})` }}
                />
                <text
                  x={centerPoint.x}
                  y={centerPoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="trap-letter"
                  style={{ pointerEvents: 'none' }}
                >
                  {outerLetters[i].toUpperCase()}
                </text>
              </g>
            );
          })}

          <g style={{ cursor: 'pointer' }} onClick={() => onLetterClick?.(center)}>
            <polygon
              points={pointsToString(centerPolygonPoints)}
              fill="url(#centerGradient)"
              stroke="none"
              className="center-polygon"
              style={{ filter: `drop-shadow(0 4px 12px ${isMothersDay ? 'rgba(188, 82, 153, 0.45)' : 'rgba(237,75,130,0.4)'})` }}
            />
            <text
              x={CENTER_X}
              y={CENTER_Y}
              textAnchor="middle"
              dominantBaseline="central"
              className="center-letter"
              style={{ pointerEvents: 'none' }}
            >
              {center.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
});

function lightenColor(color: string, amount: number): string {
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 255) + Math.floor(255 * amount));
    const gValue = Math.min(255, ((num >> 8) & 255) + Math.floor(255 * amount));
    const b = Math.min(255, (num & 255) + Math.floor(255 * amount));
    return `#${((r << 16) | (gValue << 8) | b).toString(16).padStart(6, '0')}`;
  }
  return color;
}

export default HeptagramBoardSvg;
