import type { ReactNode } from 'react';
import './PageContainer.css';

interface PageContainerProps {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}

export default function PageContainer({ children, wide = false, className = '' }: PageContainerProps) {
  return (
    <div className="page-container-outer">
      <div className={`page-container-inner ${wide ? 'wide' : ''} ${className}`.trim()}>
        {children}
      </div>
    </div>
  );
}
