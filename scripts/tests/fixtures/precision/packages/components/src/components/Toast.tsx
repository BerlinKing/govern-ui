export function Toast({ children }: { children: React.ReactNode }) {
  return <div role="status">{children}</div>;
}
