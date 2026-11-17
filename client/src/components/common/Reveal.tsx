import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface Props {
  children: ReactNode;
  /** Delay in ms — stagger siblings by passing index * 80 */
  delay?: number;
  from?: 'bottom' | 'left' | 'right' | 'scale';
  as?: ElementType;
  className?: string;
}

/** Fades and slides its children in the first time they scroll into view. */
export default function Reveal({ children, delay = 0, from = 'bottom', as: Tag = 'div', className }: Props) {
  const { ref, visible } = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className ?? ''}`}
      data-from={from === 'bottom' ? undefined : from}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
