import { cn } from "@/lib/utils";

interface LeafLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const stageSize = {
  sm: "h-8 w-12",
  md: "h-11 w-16",
  lg: "h-14 w-20",
} as const;

const leafSize = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export function LeafLoader({ className, size = "md", label = "Carregando..." }: LeafLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-2.5 text-center", className)}>
      <style>{`
        @keyframes leaf-loader-fall-a {
          0% { opacity: 0; transform: translate3d(-3px, -8px, 0) rotate(-30deg); }
          15% { opacity: .85; }
          50% { transform: translate3d(10px, 22px, 0) rotate(30deg); }
          80% { opacity: .85; }
          100% { opacity: 0; transform: translate3d(12px, 52px, 0) rotate(105deg); }
        }
        @keyframes leaf-loader-fall-b {
          0% { opacity: 0; transform: translate3d(5px, -10px, 0) rotate(25deg); }
          18% { opacity: .7; }
          50% { transform: translate3d(-7px, 26px, 0) rotate(-25deg); }
          80% { opacity: .7; }
          100% { opacity: 0; transform: translate3d(-12px, 56px, 0) rotate(-95deg); }
        }
        @keyframes leaf-loader-fall-c {
          0% { opacity: 0; transform: translate3d(-2px, -9px, 0) rotate(-12deg); }
          18% { opacity: .55; }
          50% { transform: translate3d(6px, 24px, 0) rotate(22deg); }
          80% { opacity: .55; }
          100% { opacity: 0; transform: translate3d(8px, 54px, 0) rotate(85deg); }
        }
        .leaf-loader__leaf { position: absolute; top: 0; will-change: transform, opacity; }
        .leaf-loader__leaf--1 { left: 8%; animation: leaf-loader-fall-a 3.2s ease-in-out -1.5s infinite; }
        .leaf-loader__leaf--2 { left: 47%; animation: leaf-loader-fall-b 3.6s ease-in-out -.4s infinite; }
        .leaf-loader__leaf--3 { left: 76%; animation: leaf-loader-fall-c 3s ease-in-out -2.2s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .leaf-loader__leaf { animation: none; opacity: .8; transform: rotate(-20deg); will-change: auto; }
          .leaf-loader__leaf--2 { top: 35%; transform: rotate(25deg); }
          .leaf-loader__leaf--3 { top: 65%; transform: rotate(-5deg); }
        }
      `}</style>
      <span aria-hidden="true" className={cn("relative block overflow-hidden text-emerald-700 dark:text-emerald-300", stageSize[size])}>
        {[1, 2, 3].map((leaf) => (
          <svg key={leaf} className={cn(`leaf-loader__leaf leaf-loader__leaf--${leaf}`, leafSize[size])} viewBox="0 0 20 20" fill="none">
            <path d="M2.5 14.5C3 6.5 9 3 17.5 2.5C17 11 13.5 17 5.5 17.5C3.5 17.5 2.5 16.5 2.5 14.5Z" fill="currentColor" />
            <path d="M4.5 15.5C7 12 10.5 8.5 15 5.5" stroke="hsl(var(--background))" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ))}
      </span>
      <span className={cn("text-sm text-muted-foreground dark:text-zinc-300", !label && "sr-only")}>{label || "Carregando..."}</span>
    </div>
  );
}
