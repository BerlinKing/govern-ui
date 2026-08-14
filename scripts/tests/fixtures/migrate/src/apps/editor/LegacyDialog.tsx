export function LegacyDialog({ children }: { children: React.ReactNode }) {
  return <div role="dialog" style={{ zIndex: 2147483000 }}>{children}</div>;
}
