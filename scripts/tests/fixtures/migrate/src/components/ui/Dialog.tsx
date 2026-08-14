export function Dialog({ children }: { children: React.ReactNode }) {
  return <div role="dialog" style={{ zIndex: 1000 }}>{children}</div>;
}
