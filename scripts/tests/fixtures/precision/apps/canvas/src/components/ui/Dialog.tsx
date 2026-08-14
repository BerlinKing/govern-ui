import { Dialog as SharedDialog } from "@fixture/components";

export function Dialog(props: React.ComponentProps<typeof SharedDialog>) {
  return <SharedDialog {...props} />;
}
