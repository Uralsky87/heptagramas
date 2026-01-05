import { useState, forwardRef, useImperativeHandle } from 'react';

interface HeptagramBoardSvgProps {
  center: string;
  outer: string[]; // 6 letras
  onLetterClick?: (letter: string) => void;
  successAnimation?: boolean;
  onShuffleOuter?: (shuffled: string[]) => void;
}

// ============================================
// CONSTANTES GEOMÉTRICAS - TUNING MATEMÁTICO
// ============================================
const SVG_SIZE = 300;
const CENTER_X = 150;
const CENTER_Y = 150;
const HEX_RADIUS = 66; // Radio del hexágono central (centro -> vértice) - aumentado 10%

// Variables de espaciado y forma
// g: Gap único para separación radial y lateral (en unidades viewBox)
const g = 6;

// depth: Profundidad del trapecio (distancia entre línea interior y exterior)
// Aumentado ~96% para trapecios más grandes: 28 → 55
const depth = 55;

// t: Recorte lateral de los segmentos (derivado de g)
// - Si quieres MENOS separación lateral (trapecios más juntos): reduce t (ej. g * 0.5)
// - Si quieres MÁS separación lateral (trapecios más separados): aumenta t (ej. g * 0.7)
const t = g * 0.6;
// ============================================

// Calcular punto en un círculo
function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

// Calcular los 6 vértices del hexágono regular
function getHexagonPoints() {
  const angles = [-90, -30, 30, 90, 150, 210]; // Empezando arriba
  return angles.map(angle => polarToCartesian(CENTER_X, CENTER_Y, HEX_RADIUS, angle));
}

// Calcular hexágono con radio específico (para hexInterior y hexExterior)
function getHexagonWithRadius(radius: number) {
  const angles = [-90, -30, 30, 90, 150, 210];
  return angles.map(angle => polarToCartesian(CENTER_X, CENTER_Y, radius, angle));
}

// Interpolación lineal entre dos puntos
function lerp(p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

// Distancia entre dos puntos
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calcular trapecio usando método de hexágonos concéntricos
function getTrapezoidWithGaps(i: number, hexInterior: { x: number; y: number }[], hexExterior: { x: number; y: number }[]) {
  // Lado interior del trapecio (del hexInterior)
  const intA = hexInterior[i];
  const intB = hexInterior[(i + 1) % 6];
  const Li = distance(intA, intB);
  
  // Lado exterior del trapecio (del hexExterior)
  const extA = hexExterior[i];
  const extB = hexExterior[(i + 1) % 6];
  const Lo = distance(extA, extB);
  
  // Recortar ambos segmentos por t (gap lateral)
  const innerA = lerp(intA, intB, t / Li);
  const innerB = lerp(intA, intB, 1 - t / Li);
  
  const outerA = lerp(extA, extB, t / Lo);
  const outerB = lerp(extA, extB, 1 - t / Lo);
  
  // Los 4 puntos del trapecio (orden: innerA, innerB, outerB, outerA)
  return [innerA, innerB, outerB, outerA];
}

// Convertir array de puntos a string para SVG polygon
function pointsToString(points: { x: number; y: number }[]) {
  return points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

// Calcular centro de un trapecio (promedio de sus 4 puntos)
function getTrapezoidCenter(points: { x: number; y: number }[]) {
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
}

export interface HeptagramBoardHandle {
  shuffle: () => void;
}

const HeptagramBoardSvg = forwardRef<HeptagramBoardHandle, HeptagramBoardSvgProps>(({ center, outer, onLetterClick, successAnimation, onShuffleOuter }, ref) => {
  const [outerLetters, setOuterLetters] = useState(outer);

  const shuffleOuter = () => {
    const shuffled = [...outerLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOuterLetters(shuffled);
    onShuffleOuter?.(shuffled);
  };
  // Exponer la función shuffle al componente padre
  useImperativeHandle(ref, () => ({
    shuffle: shuffleOuter
  }));
  // Obtener colores del tema actual desde CSS variables
  const centerStart = getComputedStyle(document.documentElement).getPropertyValue('--theme-center-start').trim();
  const centerEnd = getComputedStyle(document.documentElement).getPropertyValue('--theme-center-end').trim();
  const outerStart = getComputedStyle(document.documentElement).getPropertyValue('--theme-outer-start').trim();
  const outerEnd = getComputedStyle(document.documentElement).getPropertyValue('--theme-outer-end').trim();

  // Calcular geometría con hexágonos concéntricos
  // 1. Hexágono central
  const hexPoints = getHexagonPoints();
  
  // 2. Calcular apotema del hexágono central
  const apotema = HEX_RADIUS * Math.cos(Math.PI / 6);
  
  // 3. Hexágono interior (para base interior de trapecios)
  const apotemaInterior = apotema + g;
  const radioInterior = apotemaInterior / Math.cos(Math.PI / 6);
  const hexInterior = getHexagonWithRadius(radioInterior);
  
  // 4. Hexágono exterior (para base exterior de trapecios)
  const apotemaExterior = apotemaInterior + depth;
  const radioExterior = apotemaExterior / Math.cos(Math.PI / 6);
  const hexExterior = getHexagonWithRadius(radioExterior);
  
  // 5. Construir los 6 trapecios
  const trapezoids = Array.from({ length: 6 }, (_, i) => 
    getTrapezoidWithGaps(i, hexInterior, hexExterior)
  );

  return (
    <div className="heptagram-section">
      <div className={`svg-container ${successAnimation ? 'success-bounce' : ''}`}>
        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="heptagram-svg">
          {/* Definir gradientes */}
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: centerStart, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: centerEnd, stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="trapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: outerStart, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: outerEnd, stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Trapecios exteriores (dibujar primero para que queden detrás) */}
          {trapezoids.map((points, i) => {
            const centerPoint = getTrapezoidCenter(points);
            return (
              <g key={`trap-${i}`} style={{ cursor: 'pointer' }} onClick={() => onLetterClick?.(outerLetters[i])}>
                <polygon
                  points={pointsToString(points)}
                  fill="url(#trapGradient)"
                  stroke="none"
                  className="trap-shape"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}
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

          {/* Hexágono central (encima de los trapecios) */}
          <g style={{ cursor: 'pointer' }} onClick={() => onLetterClick?.(center)}>
            <polygon
              points={pointsToString(hexPoints)}
              fill="url(#hexGradient)"
              stroke="none"
              className="hex-shape"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(237,75,130,0.4))' }}
            />
            <text
              x={CENTER_X}
              y={CENTER_Y}
              textAnchor="middle"
              dominantBaseline="central"
              className="hex-letter"
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

export default HeptagramBoardSvg;
