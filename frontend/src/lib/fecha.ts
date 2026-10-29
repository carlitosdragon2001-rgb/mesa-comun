// La API guarda las fechas en SQLite, que no conserva la zona horaria: los
// timestamps llegan sin sufijo ("2026-08-29T20:31:21.631223") aunque siempre
// representan UTC (se generan con datetime.now(timezone.utc) en el backend).
// Sin esto, el navegador los interpreta como hora local y desplaza "hace X"
// por el huso horario del usuario. Si el string ya trae zona horaria, se deja
// tal cual.
export function parseFechaUtc(iso: string): Date {
  const tieneZona = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(tieneZona ? iso : `${iso}Z`);
}
