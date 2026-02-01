// frontend/components/ui/Card.tsx
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  role?: string;
  'aria-label'?: string;
}

export function Card({ className, children, role, 'aria-label': ariaLabel }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200 overflow-hidden",
        className
      )}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("px-6 py-4 border-b border-border bg-card", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground leading-tight", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("p-6 text-foreground", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("px-6 py-4 bg-muted/50 border-t border-border flex items-center gap-4", className)}>
      {children}
    </div>
  );
}
