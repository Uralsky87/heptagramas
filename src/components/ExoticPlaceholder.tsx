import { useLanguage } from '../contexts/LanguageContext';

interface ExoticPlaceholderProps {
  onBack: () => void;
}

export default function ExoticPlaceholder({ onBack }: ExoticPlaceholderProps) {
  const { t } = useLanguage();

  return (
    <div className="placeholder-container">
      <button className="btn-back" onClick={onBack}>
        {t('common.home')}
      </button>
      
      <div className="placeholder-content">
        <div className="placeholder-icon">🔒</div>
        <h2 className="placeholder-title">{t('placeholder.exotic_title')}</h2>
        <p className="placeholder-text">
          {t('placeholder.exotic_text')}
        </p>
        <div className="placeholder-features">
          <div className="feature-item">{t('placeholder.exotic_feature_1')}</div>
          <div className="feature-item">{t('placeholder.exotic_feature_2')}</div>
          <div className="feature-item">{t('placeholder.exotic_feature_3')}</div>
        </div>
      </div>
    </div>
  );
}
