const PALETA = [
  { bg: "bg-berry", text: "text-white" },
  { bg: "bg-sage", text: "text-white" },
  { bg: "bg-gold", text: "text-white" },
] as const;

export function iniciales(nombre: string): string {
  // Las plazas creadas en bloque se llaman "Residente 012": el número no dice
  // nada como inicial, así que para esos nombres se usan dos letras de la
  // palabra ("RE") en lugar de letra + dígito ("R0").
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => /\p{L}/u.test(p[0]));
  if (partes.length === 0) return nombre.trim().slice(0, 2).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}

export function colorAvatar(nombre: string): { bg: string; text: string } {
  return PALETA[hash(nombre) % PALETA.length];
}
