import { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip: string;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral:
    "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200",
  danger:
    "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200",
};

/**
 * Small icon-only button.
 *
 * Tooltip is intentionally rendered via the browser-native `title` attribute
 * rather than a custom absolute-positioned element. A custom tooltip extending
 * past the button would contribute to the scrollable overflow of any
 * ancestor with `overflow-x-auto`, producing a phantom horizontal scrollbar
 * on wide screens.
 */
export default function IconButton({
  icon,
  tooltip,
  tone = "neutral",
  className,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      aria-label={tooltip}
      title={tooltip}
      className={[
        "inline-flex items-center justify-center w-8 h-8 rounded border",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        tones[tone],
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {icon}
    </button>
  );
}
