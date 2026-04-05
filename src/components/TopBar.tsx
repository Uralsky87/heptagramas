import type { ReactNode } from 'react';
import './TopBar.css';

interface TopBarProps {
  onThemeClick?: () => void;
  onSettingsClick: () => void;
  title?: string;
  titlePlate?: boolean;
  showThemeButton?: boolean;
  showSettingsButton?: boolean;
  leftButton?: ReactNode;
  rightButton?: ReactNode; // Para permitir botón personalizado a la derecha
}

/**
 * TopBar - Barra superior unificada para todas las pantallas
 * 
 * Layout:
 * - Izquierda: botón custom o espacio reservado
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
  title = 'Palabrarium',
  titlePlate = false,
  showThemeButton = false,
  showSettingsButton = true,
  leftButton,
  rightButton,
}: TopBarProps) {
  return (
    <div className="top-bar">
      {/* Columna izquierda */}
      {leftButton ? (
        leftButton
      ) : showThemeButton ? (
        <button
          className="top-bar-btn top-bar-btn-left"
          onClick={onThemeClick}
          aria-label="Cambiar tema"
          title="Cambiar tema"
        >
          🎨
        </button>
      ) : (
        <div className="top-bar-spacer" aria-hidden="true" />
      )}

      {/* Columna centro */}
      <h1 className={`top-bar-title${titlePlate ? ' top-bar-title-plate' : ''}`}>{title}</h1>

      {/* Columna derecha */}
      {rightButton ? (
        rightButton
      ) : showSettingsButton ? (
        <button
          className="top-bar-btn top-bar-btn-right"
          onClick={onSettingsClick}
          aria-label="Ajustes"
          title="Ajustes"
        >
          ⚙️
        </button>
      ) : (
        <div className="top-bar-spacer" aria-hidden="true" />
      )}
    </div>
  );
}
