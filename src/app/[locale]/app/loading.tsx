export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="relative">
        {/* Glow halo */}
        <div
          className="absolute -inset-8 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)" }}
        />
        {/* Outer ring */}
        <div
          className="h-10 w-10 rounded-full animate-spin"
          style={{
            border: "2.5px solid rgba(var(--color-primary-rgb) / 0.1)",
            borderTopColor: "var(--color-primary)",
            borderRightColor: "rgba(var(--color-primary-rgb) / 0.4)",
            animationDuration: "0.8s",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-[5px] rounded-full animate-spin"
          style={{
            border: "2px solid transparent",
            borderBottomColor: "rgba(var(--color-primary-rgb) / 0.35)",
            animationDuration: "1.3s",
            animationDirection: "reverse",
          }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "var(--color-primary)", boxShadow: "0 0 8px rgba(var(--color-primary-rgb) / 0.5)" }}
          />
        </div>
      </div>
    </div>
  );
}
