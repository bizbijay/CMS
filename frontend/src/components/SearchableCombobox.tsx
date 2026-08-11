import { useState } from "react";

export interface ComboboxOption {
  key: string;
  label: string;
}

interface Props {
  value: string;
  selectedKey: string | null;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  onSelect: (option: ComboboxOption) => void;
  onClearSelection?: () => void;
  placeholder?: string;
  required?: boolean;
  emptyMessage?: string;
  showAddOption?: boolean;
  addLabel?: string;
  onAdd?: () => void;
  adding?: boolean;
  addingLabel?: string;
  toggleAriaLabel?: string;
  clearOnBlur?: boolean;
}

const INPUT_CLASS =
  "w-full rounded border border-slate-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function SearchableCombobox({
  value,
  selectedKey,
  options,
  onChange,
  onSelect,
  onClearSelection,
  placeholder,
  required,
  emptyMessage = "No results found.",
  showAddOption = false,
  addLabel,
  onAdd,
  adding = false,
  addingLabel = "…",
  toggleAriaLabel = "Toggle list",
  clearOnBlur = true,
}: Props) {
  const [open, setOpen] = useState(false);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    onClearSelection?.();
    setOpen(true);
  }

  function handleBlur() {
    setTimeout(() => {
      setOpen(false);
      if (clearOnBlur && selectedKey === null) onChange("");
    }, 150);
  }

  function handleSelect(option: ComboboxOption) {
    onSelect(option);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={INPUT_CLASS}
      />
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 hover:text-slate-600"
        aria-label={toggleAriaLabel}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-52 overflow-y-auto">
          {options.length === 0 && !showAddOption && (
            <div className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</div>
          )}
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 ${
                selectedKey === option.key ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
          {showAddOption && onAdd && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onAdd}
              disabled={adding}
              className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border-t border-slate-100 flex items-center gap-2 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              {adding ? addingLabel : addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
