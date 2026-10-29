import { colorAvatar, iniciales } from "../lib/avatar";

export default function Avatar({
  nombre,
  size = "md",
  className = "",
}: {
  nombre: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { bg, text } = colorAvatar(nombre);
  const dims = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${bg} ${text} ${dims} ${className}`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </div>
  );
}
