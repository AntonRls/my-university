export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-border border-t-primary"
      style={{ width: size, height: size }}
    />
  );
}


