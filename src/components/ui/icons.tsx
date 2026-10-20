export function BerryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 28.5c-6.2-2.6-9.7-8-8.7-13.2C8 11.6 11.3 9.6 16 9.6s8 2 8.7 5.7c1 5.2-2.5 10.6-8.7 13.2z"
        fill="#e0405a"
      />
      <path
        d="M16 28.5c-6.2-2.6-9.7-8-8.7-13.2C8 11.6 11.3 9.6 16 9.6"
        fill="none"
        stroke="#c22e48"
        strokeWidth="1"
        opacity=".4"
      />
      <path
        d="M16 10.5c-1.2-2.8-3.6-4-6-3.6 1.6.2 2.6 1.2 3.2 2.4-2-.8-4-.2-5 1.2 2.2-.6 3.8.1 4.6 1.2.7-1.2 2-1.7 3.2-1.2z"
        fill="#5fa65f"
      />
      <path
        d="M16 10.5c1.2-2.8 3.6-4 6-3.6-1.6.2-2.6 1.2-3.2 2.4 2-.8 4-.2 5 1.2-2.2-.6-3.8.1-4.6 1.2-.7-1.2-2-1.7-3.2-1.2z"
        fill="#4f9553"
      />
      {[
        [12, 16],
        [16, 15],
        [20, 16.5],
        [13.5, 20],
        [18, 20],
        [16, 24],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx=".7" ry="1" fill="#ffe9c9" />
      ))}
    </svg>
  );
}

export function HeartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.2 2.9 4.5 6.4 4.5c2 0 3.7 1.1 5.6 3.2 1.9-2.1 3.6-3.2 5.6-3.2 3.5 0 5.5 3.7 4 7.3C19.5 16.4 12 21 12 21z"
        fill="#ef4f6a"
      />
      <path d="M7.2 7.4c-1.4.4-2.2 1.8-1.9 3.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
    </svg>
  );
}

export function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 5.7L19.5 9.5l-5.7 1.8L12 17l-1.8-5.7L4.5 9.5l5.7-1.8L12 2z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" opacity=".7" />
    </svg>
  );
}
