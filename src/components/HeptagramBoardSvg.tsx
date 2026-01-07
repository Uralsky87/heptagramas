import { useState, forwardRef, useImperativeHandle } from 'react';

interface HeptagramBoardSvgProps {
  center: string;
  outer: string[]; // 6 o 7 letras (dinámico)
  onLetterClick?: (letter: string) => void;
  successAnimation?: boolean;
  onShuffleOuter?: (shuffled: string[]) => void;
  extraLetterIndices?: Set<number>; // Índices de letras extra para marcar visualmente
}

// ============================================
// CONSTANTES GEOMÉTRICAS - TUNING MATEMÁTICO
// ============================================
const SVG_SIZE = 300;
const CENTER_X = 150;
const CENTER_Y = 150;
const POLYGON_RADIUS = 66; // Radio del polígono central (centro -> vértice)

// Variables de espaciado y forma
// g: Gap único para separación radial y lateral (en unidades viewBox)
const g = 6;

// depth: Profundidad del trapecio (distancia entre línea interior y exterior)
const depth = 55;

// t: Recorte lateral de los segmentos (derivado de g)
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

// Calcular los vértices de un polígono regular con n lados
function getPolygonPoints(n: number, radius: number) {
  const angleStep = 360 / n;
  const startAngle = -90; // Empezar arriba
  const angles = Array.from({ length: n }, (_, i) => startAngle + i * angleStep);
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

// Calcular trapecio usando método de polígonos concéntricos
function getTrapezoidWithGaps(
  i: number, 
  n: number,
  polyInterior: { x: number; y: number }[], 
  polyExterior: { x: number; y: number }[]
) {
  // Lado interior del trapecio (del polyInterior)
  const intA = polyInterior[i];
  const intB = polyInterior[(i + 1) % n];
  const Li = distance(intA, intB);
  
  // Lado exterior del trapecio (del polyExterior)
  const extA = polyExterior[i];
  const extB = polyExterior[(i + 1) % n];
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

const HeptagramBoardSvg = forwardRef<HeptagramBoardHandle, HeptagramBoardSvgProps>(({ center, outer, onLetterClick, successAnimation, onShuffleOuter, extraLetterIndices }, ref) => {
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

  // ============================================
  // GEOMETRÍA DINÁMICA según número de lados
  // ============================================
  const n = outerLetters.length; // 6 o 7 lados
  
  // 1. Polígono central (hexágono o heptágono)
  const centerPolygonPoints = getPolygonPoints(n, POLYGON_RADIUS);
  
  // 2. Calcular apotema del polígono central (distancia centro -> medio de lado)
  const apotema = POLYGON_RADIUS * Math.cos(Math.PI / n);
  
  // 3. Polígono interior (para base interior de trapecios)
  const apotemaInterior = apotema + g;
  const radioInterior = apotemaInterior / Math.cos(Math.PI / n);
  const polyInterior = getPolygonPoints(n, radioInterior);
  
  // 4. Polígono exterior (para base exterior de trapecios)
  const apotemaExterior = apotemaInterior + depth;
  const radioExterior = apotemaExterior / Math.cos(Math.PI / n);
  const polyExterior = getPolygonPoints(n, radioExterior);
  
  // 5. Construir los trapecios (n trapecios)
  const trapezoids = Array.from({ length: n }, (_, i) => 
    getTrapezoidWithGaps(i, n, polyInterior, polyExterior)
  );
  // ============================================

  return (
    <div className="heptagram-section">
      <div className={`svg-container ${successAnimation ? 'success-bounce' : ''}`}>
        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="heptagram-svg">
          {/* Definir gradientes */}
          <defs>
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: centerStart, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: centerEnd, stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="trapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: outerStart, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: outerEnd, stopOpacity: 1 }} />
            </linearGradient>
            {/* Gradiente para letra extra (10% más claro) */}
            <linearGradient id="trapExtraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: lightenColor(outerStart, 0.1), stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: lightenColor(outerEnd, 0.1), stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Trapecios exteriores (dibujar primero para que queden detrás) */}
          {trapezoids.map((points, i) => {
            const centerPoint = getTrapezoidCenter(points);
            const isExtra = extraLetterIndices?.has(i) || false;
            const fillGradient = isExtra ? "url(#trapExtraGradient)" : "url(#trapGradient)";
            const strokeWidth = isExtra ? 2.5 : 0;
            const strokeColor = isExtra ? outerEnd : "none";
            
            return (
              <g key={`trap-${i}`} style={{ cursor: 'pointer' }} onClick={() => onLetterClick?.(outerLetters[i])}>
                <polygon
                  points={pointsToString(points)}
                  fill={fillGradient}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
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

          {/* Polígono central (encima de los trapecios) */}
          <g style={{ cursor: 'pointer' }} onClick={() => onLetterClick?.(center)}>
            <polygon
              points={pointsToString(centerPolygonPoints)}
              fill="url(#centerGradient)"
              stroke="none"
              className="center-polygon"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(237,75,130,0.4))' }}
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

// Función helper para aclarar color (simplificada)
function lightenColor(color: string, amount: number): string {
  // Si el color es en formato #RRGGBB
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 255) + Math.floor(255 * amount));
    const g = Math.min(255, ((num >> 8) & 255) + Math.floor(255 * amount));
    const b = Math.min(255, (num & 255) + Math.floor(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  // Fallback: devolver color original
  return color;
}

export default HeptagramBoardSvg;
