import { cn } from "@/lib/utils";

interface LeafLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LeafLoader({ className, size = "md", label = "Carregando..." }: LeafLoaderProps) {
  const leafSize = size === "sm" ? 24 : size === "lg" ? 56 : 40;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <svg
        width={leafSize}
        height={leafSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "leaf-sway 1.6s ease-in-out infinite" }}
        aria-hidden="true"
      >
        <style>{`
          @keyframes leaf-sway {
            0%   { transform: rotate(-12deg) scale(0.95); }
            50%  { transform: rotate(12deg) scale(1.05); }
            100% { transform: rotate(-12deg) scale(0.95); }
          }
          @keyframes leaf-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.7; }
          }
        `}</style>
        {/* Stem */}
        <path
          d="M20 36 C20 36 18 28 20 20"
          stroke="#166b50"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{ animation: "leaf-pulse 1.6s ease-in-out infinite" }}
        />
        {/* Leaf body */}
        <path
          d="M20 20 C20 20 8 18 6 8 C6 8 16 4 24 10 C30 14 20 20 20 20Z"
          fill="#166b50"
          fillOpacity="0.85"
        />
        {/* Leaf vein */}
        <path
          d="M20 20 C20 20 13 14 9 9"
          stroke="#e6f1eb"
          strokeWidth="1"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        {/* Secondary leaf */}
        <path
          d="M20 20 C20 20 28 14 32 6 C32 6 24 2 18 8 C14 12 20 20 20 20Z"
          fill="#1a8464"
          fillOpacity="0.6"
        />
      </svg>
      {label && (
        <p className="text-sm text-muted-foreground" style={{ animation: "leaf-pulse 1.6s ease-in-out infinite" }}>
          {label}
        </p>
      )}
    </div>
  );
}
