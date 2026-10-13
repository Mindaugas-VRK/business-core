import type { ReactNode } from "react";

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export const Th = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <th className={`px-1 pb-2 font-medium ${className ?? ""}`}>{children}</th>
);

export const Td = ({
  className,
  children,
  colSpan,
}: {
  className?: string;
  children?: ReactNode;
  colSpan?: number;
}) => (
  <td colSpan={colSpan} className={`px-1 py-1 ${className ?? ""}`}>
    {children}
  </td>
);
