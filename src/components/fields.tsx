"use client";

import { useState, type InputHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-xs outline-none " +
  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900";

const parse = (text: string) => (text.trim() === "" ? null : Number(text.replace(",", ".")));

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | null;
  onChange: (value: number | null) => void;
};

/**
 * Number input that keeps the user's text while typing ("1.", "", "0,5")
 * and only reports valid, non-negative numbers. Empty reports `null`.
 */
export function NumberField({ value, onChange, className, ...props }: NumberFieldProps) {
  const [text, setText] = useState(value === null ? "" : String(value));
  // Follow outside changes (e.g. import) without clobbering what is being typed.
  if (parse(text) !== value) setText(value === null ? "" : String(value));

  return (
    <input
      {...props}
      inputMode="decimal"
      className={`${inputClass} text-right tabular-nums ${className ?? ""}`}
      value={text}
      onChange={(e) => {
        const nextText = e.target.value;
        const n = parse(nextText);
        if (n !== null && (Number.isNaN(n) || n < 0)) return;
        setText(nextText);
        onChange(n);
      }}
    />
  );
}

export function Button({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300",
    secondary:
      "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
    danger: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className ?? ""}`}
    />
  );
}
