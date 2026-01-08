import type { ReactNode } from 'react';
import './PageContainer.css';

interface PageContainerProps {
  children: ReactNode;
  wide?: boolean; // Para ExoticsPlay que necesita más ancho en desktop
}

/**
 * Contenedor de página que centra el contenido en todas las pantallas.
 * Uso obligatorio en: Home, DailyScreen, ClassicList, ExoticsHome, ExoticsPlay, Game
 */
export default function PageContainer({ children, wide = false }: PageContainerProps) {
  return (
    <div className="page-container-outer">
      <div className={`page-container-inner ${wide ? 'wide' : ''}`}>
        {children}
      </div>
    </div>
  );
}
