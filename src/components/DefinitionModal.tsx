import '../styles/definitionModal.css';

interface DefinitionModalProps {
  word: string;
  definition: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DefinitionModal({ word, definition, isOpen, onClose }: DefinitionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="definition-modal-overlay" onClick={onClose}>
      <div className="definition-modal" onClick={(e) => e.stopPropagation()}>
        <button className="definition-close" onClick={onClose}>✕</button>
        <h3 className="definition-word">{word}</h3>
        <div className="definition-text">
          {definition}
        </div>
      </div>
    </div>
  );
}
