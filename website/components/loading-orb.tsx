import { ThinkingOrb, type OrbState, type OrbTheme } from "thinking-orbs";

type LoadingOrbProps = {
  state?: OrbState;
  size?: "inline" | "center";
  theme?: OrbTheme;
  className?: string;
};

export function LoadingOrb({
  state = "solving",
  size = "inline",
  theme = "light",
  className,
}: LoadingOrbProps) {
  return (
    <ThinkingOrb
      state={state}
      size={size === "center" ? 64 : 20}
      theme={theme}
      className={className}
    />
  );
}
