import type { ReactNode } from 'react';
import './TopBar.css';

interface TopBarProps {
  onThemeClick: () => void;
  onSettingsClick: () => void;
  rightButton?: ReactNode; // Para permitir botón personalizado a la derecha
}

/**
 * TopBar - Barra superior unificada para todas las pantallas
 * 
 * Layout:
 * - Izquierda: botón de tema (🎨)
 * - Centro: título "Palabrarium" centrado
 * - Derecha: botón de ajustes (⚙️)
 * 
 * Características:
 * - Grid 3 columnas: 1fr auto 1fr
 * - Título realmente centrado (no afectado por ancho de botones)
 * - Touch targets de 44px para móvil
 * - Tipografía display mejorada
 */
export default function TopBar({
  onThemeClick,
  onSettingsClick,
  rightButton,
}: TopBarProps) {
  return (
    <div className="top-bar">
      {/* Columna izquierda */}
      <button
        className="top-bar-btn top-bar-btn-left"
        onClick={onThemeClick}
        aria-label="Cambiar tema"
        title="Cambiar tema"
      >
        🎨
      </button>

      {/* Columna centro */}
      <h1 className="top-bar-title">Palabrarium</h1>

      {/* Columna derecha */}
      {rightButton ? (
        rightButton
      ) : (
        <button
          className="top-bar-btn top-bar-btn-right"
          onClick={onSettingsClick}
          aria-label="Ajustes"
          title="Ajustes"
        >
          ⚙️
        </button>
      )}
    </div>
  );
}
