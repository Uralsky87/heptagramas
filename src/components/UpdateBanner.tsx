import '../styles/updateBanner.css';

interface UpdateBannerProps {
  isVisible: boolean;
  isUpdating: boolean;
  onUpdate: () => void;
}

export default function UpdateBanner({ isVisible, isUpdating, onUpdate }: UpdateBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <div className="update-banner-text">
          <span className="update-icon">↻</span>
          <span>Actualización disponible</span>
        </div>
        <button
          className="update-banner-button"
          onClick={onUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
}
