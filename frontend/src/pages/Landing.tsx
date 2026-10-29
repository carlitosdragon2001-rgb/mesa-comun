import { Link } from "react-router-dom";

const KPIS = [
  { label: "Residencia de 250 plazas", value: "28.000 €", unit: "/año", sub: "escenario moderado · 17.500–42.000 € según madurez" },
  { label: "Red de residencias · Sevilla", value: "0,67 M €", unit: "/año", sub: "≈6.000 plazas (US propias + adscritas)" },
  { label: "España", value: "14,8 M €", unit: "/año", sub: "132.335 plazas (DBK Informa, 2025)" },
];

const LEVERS = [
  {
    n: "1",
    name: "Menos sobreproducción y desperdicio de plato",
    desc: "El menú se dimensiona a los perfiles reales de cada residente, no a un margen “por si acaso”. Mismo resultado que persigue el software de seguimiento de desperdicio ya en uso en restauración institucional — aquí, por la vía preventiva.",
    pct: "3–8%",
    pctSub: "food cost",
  },
  {
    n: "2",
    name: "Compra sin sobre-stock ni pedidos de urgencia",
    desc: "La lista de la compra sale del menú, no de la costumbre. Menos compra de más, menos pedidos de último minuto a peor precio.",
    pct: "2–4%",
    pctSub: "food cost",
  },
  {
    n: "3",
    name: "Menos horas de gestión manual",
    desc: "Menús, restricciones y pedidos calculados automáticamente en vez de a mano cada semana. Beneficio adicional, no incluido en las cifras de ahorro.",
    pct: "3–5h",
    pctSub: "por semana",
  },
];

const ESCENARIOS = [
  { nombre: "Conservador", sub: "solo el extremo bajo de la palanca 1", pct: "5%", residencia: "17.500 €", sevilla: "0,42 M €", espana: "9,3 M €", destacado: false },
  { nombre: "Moderado", sub: "extremo alto de la palanca 1 + parte de la 2", pct: "8%", residencia: "28.000 €", sevilla: "0,67 M €", espana: "14,8 M €", destacado: true },
  { nombre: "Optimista", sub: "uso maduro (2–3 años), palancas 1+2 completas", pct: "12%", residencia: "42.000 €", sevilla: "1,01 M €", espana: "22,2 M €", destacado: false },
];

const ROI = [
  { nombre: "Conservador", meses: "3,7 meses", retorno: "≈3,2× lo invertido cada año", destacado: false },
  { nombre: "Moderado", meses: "2,3 meses", retorno: "≈5,2× lo invertido cada año", destacado: true },
  { nombre: "Optimista", meses: "1,5 meses", retorno: "≈7,8× lo invertido cada año", destacado: false },
];

const PRECIOS = [
  {
    nombre: "Pequeña",
    rango: "Hasta 100 plazas",
    precio: "2,20 €",
    unidad: "/plaza/mes",
    incluye: [
      "Menú semanal optimizado (motor MILP)",
      "Lista de la compra automática",
      "Perfiles y restricciones ilimitados",
      "Panel de seguimiento e historial",
      "Soporte por email",
    ],
    cta: "Empezar",
    destacado: false,
  },
  {
    nombre: "Mediana",
    rango: "100–400 plazas",
    precio: "1,80 €",
    unidad: "/plaza/mes",
    incluye: [
      "Todo lo de Pequeña",
      "Precio de referencia del caso de negocio",
      "Alertas de presupuesto y variedad",
      "Recalculo automático ante cambios",
      "Soporte prioritario",
    ],
    cta: "Probar la demo",
    destacado: true,
  },
  {
    nombre: "Red / Grande",
    rango: "Más de 400 plazas o multi-centro",
    precio: "A medida",
    unidad: "",
    incluye: [
      "Todo lo de Mediana",
      "Gestión multi-centro",
      "Descuento por volumen",
      "Exportación de datos",
      "Onboarding acompañado",
    ],
    cta: "Hablar con ventas",
    destacado: false,
  },
];

// Precio semanal objetivo para residencias grandes (varios cientos o miles de
// plazas): mismo coste de materia prima de referencia (35 €/residente/semana,
// = 5 €/día × 7) y el mismo ahorro por escenario (5/8/12%) que en el resto de
// la página; el precio del software baja por plaza según el volumen.
const GRANDES = [
  { plazas: 500, precioPlaza: 0.37, gastoSemanal: 17500, ahorroCons: 875, ahorroOpt: 2100, retorno: "7,6×" },
  { plazas: 1000, precioPlaza: 0.32, gastoSemanal: 35000, ahorroCons: 1750, ahorroOpt: 4200, retorno: "8,8×" },
  { plazas: 2000, precioPlaza: 0.28, gastoSemanal: 70000, ahorroCons: 3500, ahorroOpt: 8400, retorno: "10,0×" },
  { plazas: 5000, precioPlaza: 0.25, gastoSemanal: 175000, ahorroCons: 8750, ahorroOpt: 21000, retorno: "11,2×" },
];

const formatoEuro = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 sm:mb-11 flex flex-wrap items-end justify-between gap-6">
      <div>
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</span>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink text-balance">{title}</h2>
        {sub && <p className="mt-2.5 max-w-[42ch] text-ink-soft">{sub}</p>}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="sticky top-0 z-20 border-b border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5 font-display text-lg font-semibold">
            <svg viewBox="0 0 26 26" className="h-6 w-6 flex-none" fill="none">
              <circle cx="13" cy="13" r="11.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M13 5.2V13L18 16.6" stroke="#a23e4c" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="13" cy="13" r="1.6" fill="currentColor" />
            </svg>
            Mesa Común
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft sm:flex">
            <a href="#numeros" className="hover:text-ink">El ahorro</a>
            <a href="#precios" className="hover:text-ink">Precios</a>
          </nav>
          <Link
            to="/app/inicio"
            className="rounded-lg bg-berry px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-berry-dark"
          >
            Probar la demo
          </Link>
        </div>
      </div>

      <header className="mx-auto max-w-5xl px-5 pt-14 sm:px-8 sm:pt-20">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">Para residencias de estudiantes</span>
        <h1 className="mt-3.5 max-w-[18ch] text-balance font-display text-4xl font-semibold leading-[1.05] sm:text-5xl">
          El desperdicio no se ve en la cocina. Se ve en la cuenta.
        </h1>
        <p className="mt-4 max-w-[62ch] font-display text-lg italic text-ink-soft sm:text-xl">
          Ajustar el menú a lo que cada residente realmente come y necesita no es solo mejor servicio: es presupuesto
          que deja de perderse antes de llegar al cubo de basura.
        </p>

        <div className="mt-8 grid gap-3.5 sm:grid-cols-3">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
              <div className="text-[0.78rem] font-medium text-ink-muted">{kpi.label}</div>
              <div className="mt-1.5 font-display text-[1.7rem] font-semibold tabular-nums">
                {kpi.value}
                <span className="ml-1 font-sans text-base font-medium text-ink-muted">{kpi.unit}</span>
              </div>
              <div className="mt-1 text-[0.82rem] text-ink-muted">{kpi.sub}</div>
            </div>
          ))}
        </div>
        <p className="mt-3.5 text-[0.82rem] text-ink-muted">
          Escenario moderado de un estudio de tres niveles — metodología y fuentes{" "}
          <a href="#metodologia" className="text-ink-soft underline underline-offset-2">al final de la página</a>.
        </p>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20" id="como">
          <SectionHead eyebrow="Cómo se genera el ahorro" title="Tres decisiones que hoy se toman a ojo" />
          <div className="grid gap-4 sm:grid-cols-3">
            {LEVERS.map((lever, i) => (
              <div
                key={lever.n}
                className="rounded-2xl border border-ink/10 bg-paper-raised p-6 shadow-sm"
                style={{ borderTop: `3px solid ${["#a23e4c", "#4b6455", "#ad7526"][i]}` }}
              >
                <h3 className="font-display text-lg font-semibold">{lever.name}</h3>
                <p className="mt-2.5 text-sm text-ink-soft">{lever.desc}</p>
                <div className="mt-4 font-display text-xl font-semibold text-berry tabular-nums">
                  {lever.pct} <span className="font-sans text-xs font-medium text-ink-muted">{lever.pctSub}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="mx-auto max-w-5xl border-ink/10" />

        <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20" id="numeros">
          <SectionHead
            eyebrow="El caso de negocio"
            title="Tres palancas, tres escenarios"
            sub="El ahorro no sale de un único truco: son mecanismos independientes, cada uno con su propia evidencia."
          />

          <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper-raised shadow-sm">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  {["Escenario", "Ahorro s/ alimentación", "Residencia · 250 plazas", "Sevilla · ≈6.000 plazas", "España · 132.335 plazas"].map((h, i) => (
                    <th
                      key={h}
                      className={`border-b border-ink/10 px-4 py-3.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ESCENARIOS.map((esc) => (
                  <tr key={esc.nombre} className={esc.destacado ? "bg-berry/[0.06]" : ""}>
                    <td className="border-b border-ink/10 px-4 py-4">
                      <span className="font-medium text-ink">{esc.nombre}</span>
                      {esc.destacado && (
                        <span className="ml-2 rounded-full bg-berry/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-berry">
                          recomendado
                        </span>
                      )}
                      <span className="mt-0.5 block text-[0.78rem] text-ink-muted">{esc.sub}</span>
                    </td>
                    <td className="border-b border-ink/10 px-4 py-4 text-right tabular-nums text-ink-soft">{esc.pct}</td>
                    <td className={`border-b border-ink/10 px-4 py-4 text-right tabular-nums ${esc.destacado ? "font-display font-semibold text-berry" : "text-ink"}`}>{esc.residencia}</td>
                    <td className={`border-b border-ink/10 px-4 py-4 text-right tabular-nums ${esc.destacado ? "font-display font-semibold text-berry" : "text-ink"}`}>{esc.sevilla}</td>
                    <td className={`border-b border-ink/10 px-4 py-4 text-right tabular-nums ${esc.destacado ? "font-display font-semibold text-berry" : "text-ink"}`}>{esc.espana}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-ink/10 bg-paper-raised p-6 shadow-sm sm:p-7">
            <div className="text-sm font-semibold">¿Cuándo se paga solo? — a un precio de referencia de 1,80 €/plaza/mes</div>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
              {ROI.map((r) => (
                <div key={r.nombre} className="rounded-xl border border-ink/10 bg-paper p-4">
                  <div className="text-[0.78rem] font-medium text-ink-muted">{r.nombre}</div>
                  <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${r.destacado ? "text-berry" : "text-ink"}`}>{r.meses}</div>
                  <div className="mt-0.5 text-[0.78rem] text-ink-muted">{r.retorno}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 border-t border-ink/10 pt-4.5 text-[0.8rem] leading-relaxed text-ink-muted" id="metodologia">
            <strong className="text-ink-soft">Estudio de escenarios, no una auditoría de tu residencia.</strong> Palanca 1:
            software de reducción de desperdicio ya en uso en restauración institucional (Winnow, Leanpath) documenta
            ahorros de food cost del 3–8% desde el primer año, y reducciones de hasta el 50% en peso de residuos en
            hostelería y restauración colectiva — Mesa Común persigue el mismo resultado por la vía preventiva
            (ajustar producción y compra a la demanda real antes de cocinar) en vez de medirlo después. Palanca 2: la
            gestión de compras eficiente puede liberar hasta un 20% de coste operativo en la función de compras en
            general; aquí solo se aplica una fracción conservadora (2–4%) al gasto en alimentación. Palanca 3 es una
            estimación de horas de personal liberadas, no un ahorro monetario directo. Base del cálculo: coste de
            materia prima ≈5,00 €/residente/día (menú universitario medio de 6 € × food cost del 35%, prorrateado a
            las tres comidas), 280 días de manutención al año. Fuentes:{" "}
            <a href="https://www.winnowsolutions.com/en/case-studies" target="_blank" rel="noopener" className="underline underline-offset-2">Winnow, casos de éxito</a>,{" "}
            <a href="https://www.sciencedirect.com/science/article/pii/S0956053X25001072" target="_blank" rel="noopener" className="underline underline-offset-2">estudio HORECA sobre desperdicio, ScienceDirect</a>,{" "}
            <a href="https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/agricultura/paginas/2025/010825-planas-reduccion-desperdicio-alimentario.aspx" target="_blank" rel="noopener" className="underline underline-offset-2">MAPA 2024</a>,{" "}
            <a href="https://www.dbk.es/es/detalle-nota/residencias-estudiantes-2025" target="_blank" rel="noopener" className="underline underline-offset-2">DBK Informa 2025</a> y{" "}
            <a href="https://www.us.es/actualidad-de-la-us/convocatoria-de-plazas-en-residencias-universitarias-propias-y-colegio-mayor" target="_blank" rel="noopener" className="underline underline-offset-2">Universidad de Sevilla — SACU</a>.
          </p>
        </section>

        <hr className="mx-auto max-w-5xl border-ink/10" />

        <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20" id="precios">
          <SectionHead eyebrow="Precios" title="Un plan por plaza, sin sorpresas" sub="El mismo motor de optimización desde una residencia pequeña hasta un operador con miles de plazas; lo que cambia es el volumen." />
          <div className="grid gap-4 sm:grid-cols-3">
            {PRECIOS.map((plan) => (
              <div
                key={plan.nombre}
                className={`flex flex-col rounded-2xl p-6 shadow-sm ${
                  plan.destacado ? "border-2 border-berry bg-paper-raised" : "border border-ink/10 bg-paper-raised"
                }`}
              >
                {plan.destacado && (
                  <span className="mb-3 w-fit rounded-full bg-berry px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                    Más elegido
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold">{plan.nombre}</h3>
                <p className="text-[0.82rem] text-ink-muted">{plan.rango}</p>
                <div className="mt-4 font-display text-3xl font-semibold tabular-nums">
                  {plan.precio}
                  {plan.unidad && <span className="font-sans text-sm font-medium text-ink-muted"> {plan.unidad}</span>}
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-soft">
                  {plan.incluye.map((item) => (
                    <li key={item} className="flex gap-2">
                      <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 flex-none text-sage"><path fill="currentColor" d="M13.7 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L7 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app/inicio"
                  className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                    plan.destacado ? "bg-berry text-white hover:bg-berry-dark" : "border border-ink/20 text-ink hover:bg-paper-sunken"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h3 className="font-display text-xl font-semibold">Precio semanal para grandes residencias y operadores</h3>
            <p className="mt-1.5 max-w-[62ch] text-sm text-ink-soft">
              A partir de varios cientos de plazas el presupuesto ya se piensa en semanas, no en meses — así que el
              precio también. El precio por plaza baja con el volumen; el retorno, al revés, sube.
            </p>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-paper-raised shadow-sm">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr>
                    {["Plazas", "Precio del software /semana", "Gasto en alimentación /semana", "Ahorro semanal (5–12%)", "Retorno · escenario moderado"].map((h, i) => (
                      <th
                        key={h}
                        className={`border-b border-ink/10 px-4 py-3.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted ${i === 0 ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GRANDES.map((fila) => (
                    <tr key={fila.plazas}>
                      <td className="border-b border-ink/10 px-4 py-4 font-medium text-ink">{formatoEuro.format(fila.plazas)}</td>
                      <td className="border-b border-ink/10 px-4 py-4 text-right tabular-nums text-ink">
                        {formatoEuro.format(fila.plazas * fila.precioPlaza)} €
                        <span className="ml-1 text-[0.75rem] text-ink-muted">({fila.precioPlaza.toFixed(2)} €/plaza)</span>
                      </td>
                      <td className="border-b border-ink/10 px-4 py-4 text-right tabular-nums text-ink-soft">{formatoEuro.format(fila.gastoSemanal)} €</td>
                      <td className="border-b border-ink/10 px-4 py-4 text-right tabular-nums text-ink-soft">
                        {formatoEuro.format(fila.ahorroCons)}–{formatoEuro.format(fila.ahorroOpt)} €
                      </td>
                      <td className="border-b border-ink/10 px-4 py-4 text-right font-display font-semibold tabular-nums text-berry">{fila.retorno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[0.78rem] text-ink-muted">
              Mismo coste de materia prima de referencia que en el resto de la página (≈5,00 €/residente/día) y los
              mismos tres escenarios de ahorro (5% conservador / 8% moderado / 12% optimista). El retorno mostrado es
              el ahorro semanal del escenario moderado dividido entre el precio semanal del software — en las cuatro
              filas, el software se paga solo varias veces por semana desde el primer momento.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">Siguiente paso</span>
          <h2 className="mx-auto mt-3.5 max-w-[22ch] text-balance font-display text-3xl font-semibold sm:text-4xl">
            ¿Lo calculamos con los datos reales de tu residencia?
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] font-display text-lg italic text-ink-soft">
            Plazas, presupuesto actual y menú de una semana bastan para sustituir estas estimaciones por una cifra propia.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <Link to="/app/inicio" className="rounded-lg bg-berry px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-berry-dark">
              Probar la demo
            </Link>
            <a href="#precios" className="rounded-lg border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-paper-sunken">
              Ver precios
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-2 text-[0.82rem] text-ink-muted">
          <span>Mesa Común — caso de negocio para residencias de estudiantes</span>
          <span>El mismo motor se adapta a residencias de mayores, centros deportivos o familias</span>
        </div>
      </footer>
    </div>
  );
}
