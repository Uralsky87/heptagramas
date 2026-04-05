interface BackChevronIconProps {
  className?: string;
}

export default function BackChevronIcon({ className = 'top-bar-back-icon' }: BackChevronIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11.75 4.75L6.5 10l5.25 5.25" />
    </svg>
  );
}
