import { checkPassword } from "../services/passwordPolicy";

interface Props {
  value: string;
  /** Hide entirely when the password field is empty. Defaults to false. */
  hideWhenEmpty?: boolean;
  className?: string;
}

export default function PasswordRequirements({
  value,
  hideWhenEmpty = false,
  className,
}: Props) {
  if (hideWhenEmpty && value.length === 0) return null;

  const rules = checkPassword(value);

  return (
    <ul
      className={`text-xs space-y-1 ${className ?? ""}`}
      aria-label="Password requirements"
    >
      {rules.map((r) => (
        <li
          key={r.id}
          className={`flex items-center gap-1.5 ${
            r.passed ? "text-green-600" : "text-slate-500"
          }`}
        >
          <span aria-hidden="true" className="inline-flex w-4">
            {r.passed ? <CheckIcon /> : <DotIcon />}
          </span>
          <span>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-2 h-2"
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
