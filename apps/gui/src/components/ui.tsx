import { CaretDown, Info, SpinnerGap } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function SectionTitle({ children, info = false }: { children: ReactNode; info?: boolean }) {
  return (
    <h2 className="section-title">
      {children}
      {info && <Info aria-label="More information" size={16} weight="regular" />}
    </h2>
  );
}

export function IconButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`icon-button ${className}`} type="button" {...props}>
      {props.disabled ? <SpinnerGap className="spin" size={20} /> : children}
    </button>
  );
}

export function SelectControl({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`select-control ${className}`}>
      <select {...props}>{children}</select>
      <CaretDown size={15} weight="bold" aria-hidden="true" />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="toggle"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-control" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
