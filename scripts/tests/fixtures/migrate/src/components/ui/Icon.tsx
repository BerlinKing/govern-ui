import { Check, X } from "lucide-react";
import checkUrl from "../../assets/check.svg";

export function Icon({ name }: { name: "check" | "close" }) {
  return <span data-check-url={checkUrl} className="inline-flex h-6 w-6 items-center justify-center rounded-md p-1 shadow-sm">{name === "check" ? <Check /> : <X />}</span>;
}
