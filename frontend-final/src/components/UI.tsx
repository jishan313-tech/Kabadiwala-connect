import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import { Volume2 } from 'lucide-react';
import { audio } from '../services/audio';
import { useTranslation } from 'react-i18next';

export function Button(
  p: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...p}
      className={`btn ${p.className || ''}`}
    >
      {p.children}
    </button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {children}
    </section>
  );
}

export function Status({
  value,
}: {
  value: string;
}) {
  return (
    <span className="status">
      ● {value.replaceAll('_', ' ')}
    </span>
  );
}

export function Speaker({
  text,
}: {
  text: string;
}) {
  const { i18n } = useTranslation();

  return (
    <button
      type="button"
      className="speaker"
      aria-label={`Listen: ${text}`}
      onClick={() =>
        audio.speak(text, i18n.language)
      }
    >
      <Volume2 />
    </button>
  );
}

export function Loading() {
  return (
    <div
      className="skeleton"
      aria-label="Loading"
    />
  );
}

export function Empty({
  text,
  action,
}: {
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">♻</div>
      <p>{text}</p>
      {action}
    </div>
  );
}