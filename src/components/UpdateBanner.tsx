import '../styles/updateBanner.css';
import { useLanguage } from '../contexts/useLanguage';

interface UpdateBannerProps {
  isVisible: boolean;
  isUpdating: boolean;
  showPersistentMessage?: boolean;
  onUpdate: () => void;
}

export default function UpdateBanner({
  isVisible,
  isUpdating,
  showPersistentMessage = false,
  onUpdate,
}: UpdateBannerProps) {
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <div className="update-banner-text">
          <span className="update-icon">↻</span>
          <span>{showPersistentMessage ? t('update.ready_to_apply') : t('update.available')}</span>
        </div>
        <button
          className="update-banner-button"
          onClick={onUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? t('update.updating') : t('update.update')}
        </button>
      </div>
    </div>
  );
}
