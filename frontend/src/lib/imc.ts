export function calcularImc(pesoKg?: number | null, alturaCm?: number | null): number | null {
  if (!pesoKg || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

export function clasificarImc(imc: number): string {
  if (imc < 18.5) return "bajo peso";
  if (imc < 25) return "normal";
  if (imc < 30) return "sobrepeso";
  return "obesidad";
}
