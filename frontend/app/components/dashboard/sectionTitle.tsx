import type React from "react";

export default function SectionTitle({
                          icon: Icon,
                          children,
                      }: {
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-center gap-2">
            <Icon className="neonIcon h-6 w-6 text-[#56FF0A]" />
            <span className="neonTitle text-2xl sm:text-3xl font-extrabold text-[#56FF0A]">{children}</span>
            <style jsx>{`
  .neonTitle {
    text-shadow: 0 0 4px rgba(86, 255, 10, 0.22), 0 0 12px rgba(86, 255, 10, 0.15);
    animation: glowPulse 5.5s ease-in-out infinite;
  }
  .neonIcon {
    filter: drop-shadow(0 0 4px rgba(86, 255, 10, 0.22)) drop-shadow(0 0 12px rgba(86, 255, 10, 0.15));
    animation: glowPulse 5.5s ease-in-out infinite;
  }
  @keyframes glowPulse {
    0%, 100% {
      text-shadow: 0 0 4px rgba(86, 255, 10, 0.22), 0 0 12px rgba(86, 255, 10, 0.15);
      filter: drop-shadow(0 0 4px rgba(86, 255, 10, 0.22)) drop-shadow(0 0 12px rgba(86, 255, 10, 0.15));
    }
    50% {
      text-shadow: 0 0 7px rgba(86, 255, 10, 0.35), 0 0 18px rgba(86, 255, 10, 0.25);
      filter: drop-shadow(0 0 7px rgba(86, 255, 10, 0.35)) drop-shadow(0 0 18px rgba(86, 255, 10, 0.25));
    }
  }
`}</style>
        </div>
    )
}