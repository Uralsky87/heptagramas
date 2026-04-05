import '../styles/initialLoadingScreen.css';

interface InitialLoadingScreenProps {
  message: string;
}

export default function InitialLoadingScreen({ message }: InitialLoadingScreenProps) {
  return (
    <div className="initial-loading-screen">
      <div className="initial-loading-card">
        <div className="initial-loading-emblem" aria-hidden="true">
          <div className="initial-loading-emblem-core" />
        </div>
        <div className="initial-loading-title-plate">
          <h1 className="initial-loading-title">Palabrarium</h1>
        </div>
        <p className="initial-loading-message">{message}</p>
        <div className="initial-loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
