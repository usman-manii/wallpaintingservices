// frontend/components/ui/Card.tsx
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("px-6 py-4 border-b border-slate-100", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={cn("text-sm text-slate-500 dark:text-slate-400 mt-1", className)}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center", className)}>{children}</div>;
}
