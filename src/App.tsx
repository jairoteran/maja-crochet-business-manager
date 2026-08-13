import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  CloudOff,
  Download,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Package,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  loadRemoteStore,
  saveRemoteStore,
  signIn,
  signOut,
  supabase,
  supabaseConfigured,
} from "./supabase";
import "./App.css";
type Page =
  "Inicio" | "Ventas" | "Gastos" | "Clientes" | "Inventario" | "Mi contador IA";
type Sale = {
  id: number;
  date: string;
  product: string;
  customer: string;
  amount: number;
  cost: number;
  status: "Pagado" | "Pendiente";
};
type Expense = {
  id: number;
  date: string;
  description: string;
  category: "Lana" | "Herramientas" | "Empaque" | "Otro";
  amount: number;
};
type Customer = {
  id: number;
  name: string;
  phone: string;
  orders: number;
  total: number;
};
type Yarn = {
  id: number;
  name: string;
  color: string;
  units: number;
  min: number;
  cost: number;
};
type Store = {
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  yarn: Yarn[];
};
const today = new Date().toISOString().slice(0, 10);
const initial: Store = {
  sales: [],
  expenses: [],
  customers: [],
  yarn: [],
};
const money = (n: number) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(
    n,
  );
const dateLabel = (d: string) =>
  new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" }).format(
    new Date(`${d}T12:00:00`),
  );
function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("Inicio");
  const [store, setStore] = useState<Store>(() => {
    try {
      return JSON.parse(localStorage.getItem("maja-store-v2") || "") as Store;
    } catch {
      return initial;
    }
  });
  const [modal, setModal] = useState<
    "sale" | "expense" | "customer" | "yarn" | null
  >(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const startupStore = useRef(store);
  const [syncStatus, setSyncStatus] = useState<
    "connecting" | "synced" | "saving" | "local" | "error"
  >("connecting");

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthChecked(true);
    });
    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthChecked(true);
      if (!session) {
        setRemoteReady(false);
        setStore(initial);
        localStorage.removeItem("maja-store-v2");
      }
    });
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !userId) return;
    let active = true;
    setSyncStatus("connecting");
    void loadRemoteStore<Store>(userId).then(async ({ data, error }) => {
      if (!active) return;
      if (error) {
        setSyncStatus("local");
        return;
      }
      if (data?.sales && data.expenses && data.customers && data.yarn) {
        setStore(data);
      } else {
        const saveError = await saveRemoteStore(startupStore.current, userId);
        if (!active) return;
        if (saveError) {
          setSyncStatus("error");
          return;
        }
      }
      setRemoteReady(true);
      setSyncStatus("synced");
    });
    return () => {
      active = false;
    };
  }, [authChecked, userId]);

  useEffect(() => {
    localStorage.removeItem("maja-store");
    localStorage.setItem("maja-store-v2", JSON.stringify(store));
    if (!remoteReady || !userId) return;
    setSyncStatus("saving");
    const timeout = window.setTimeout(() => {
      void saveRemoteStore(store, userId).then((error) =>
        setSyncStatus(error ? "error" : "synced"),
      );
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [store, remoteReady, userId]);

  if (!authChecked)
    return (
      <div className="auth-loading">
        <img className="brand-logo" src="/maja-logo.jpg" alt="Maja Tejidos" />
        <p>Preparando tu taller…</p>
      </div>
    );
  if (!userId) return <LoginPage configured={supabaseConfigured} />;
  const go = (p: Page) => {
    setPage(p);
    setMobileNav(false);
  };
  const removeSale = (id: number) => {
    if (
      !window.confirm("¿Eliminar esta venta? Esta acción no se puede deshacer.")
    )
      return;
    setStore((current) => {
      const sale = current.sales.find((item) => item.id === id);
      if (!sale) return current;
      return {
        ...current,
        sales: current.sales.filter((item) => item.id !== id),
        customers: current.customers.map((customer) =>
          customer.name.toLowerCase() === sale.customer.toLowerCase()
            ? {
                ...customer,
                orders: Math.max(0, customer.orders - 1),
                total: Math.max(0, customer.total - sale.amount),
              }
            : customer,
        ),
      };
    });
  };
  const removeCustomer = (id: number) => {
    if (
      !window.confirm(
        "¿Eliminar este cliente? Sus ventas históricas se conservarán.",
      )
    )
      return;
    setStore((current) => ({
      ...current,
      customers: current.customers.filter((customer) => customer.id !== id),
    }));
  };
  const removeYarn = (id: number) => {
    if (!window.confirm("¿Eliminar esta lana del inventario?")) return;
    setStore((current) => ({
      ...current,
      yarn: current.yarn.filter((item) => item.id !== id),
    }));
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <img className="brand-logo" src="/maja-logo.jpg" alt="Maja Tejidos" />
          <div>
            <strong>Maja</strong>
            <small>Mi taller de tejido</small>
          </div>
        </div>
        <button className="close-nav" onClick={() => setMobileNav(false)}>
          <X />
        </button>
        <nav>
          <Nav
            icon={<LayoutDashboard />}
            label="Inicio"
            page={page}
            select={go}
          />
          <Nav icon={<ShoppingBag />} label="Ventas" page={page} select={go} />
          <Nav icon={<ReceiptText />} label="Gastos" page={page} select={go} />
          <Nav icon={<Users />} label="Clientes" page={page} select={go} />
          <Nav icon={<Package />} label="Inventario" page={page} select={go} />
          <div className="nav-separator" />
          <Nav
            icon={<Sparkles />}
            label="Mi contador IA"
            page={page}
            select={go}
            special
          />
        </nav>
        <button className="sidebar-foot" onClick={() => void signOut()}>
          <LogOut />
          <span>Cerrar sesión</span>
        </button>
      </aside>
      {mobileNav && (
        <div className="scrim" onClick={() => setMobileNav(false)} />
      )}
      <main>
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileNav(true)}>
            <Menu />
          </button>
          <div className="welcome">
            <span>Hola, Maja</span>
            <small>Tu negocio, claro y en orden.</small>
          </div>
          <div className="top-actions">
            <span
              className={`sync-status ${syncStatus}`}
              title="Estado de la base de datos"
            >
              {syncStatus === "local" || syncStatus === "error" ? (
                <CloudOff />
              ) : (
                <Cloud />
              )}
              <span>
                {syncStatus === "synced"
                  ? "Guardado"
                  : syncStatus === "saving"
                    ? "Guardando…"
                    : syncStatus === "connecting"
                      ? "Conectando…"
                      : syncStatus === "error"
                        ? "Error al guardar"
                        : "Solo local"}
              </span>
            </span>
            <button className="icon-button">
              <Search />
            </button>
            <div className="avatar">MJ</div>
          </div>
        </header>
        <div className="content">
          {page === "Inicio" && (
            <Dashboard store={store} go={go} open={setModal} />
          )}{" "}
          {page === "Ventas" && (
            <SalesPage
              store={store}
              open={() => setModal("sale")}
              remove={removeSale}
            />
          )}{" "}
          {page === "Gastos" && (
            <ExpensesPage store={store} open={() => setModal("expense")} />
          )}{" "}
          {page === "Clientes" && (
            <CustomersPage
              store={store}
              open={() => setModal("customer")}
              remove={removeCustomer}
            />
          )}{" "}
          {page === "Inventario" && (
            <InventoryPage
              store={store}
              open={() => setModal("yarn")}
              remove={removeYarn}
            />
          )}{" "}
          {page === "Mi contador IA" && <AIPage store={store} />}
        </div>
      </main>
      {modal && (
        <EntryModal
          type={modal}
          store={store}
          update={setStore}
          close={() => setModal(null)}
        />
      )}
    </div>
  );
}
function LoginPage({ configured }: { configured: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const message = await signIn(username, password);
    if (message) setError(message);
    setLoading(false);
  };
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img
            className="brand-logo login-logo"
            src="/maja-logo.jpg"
            alt="Maja Tejidos"
          />
          <div>
            <strong>Maja</strong>
            <small>Mi taller de tejido</small>
          </div>
        </div>
        <div className="login-copy">
          <p className="eyebrow">BIENVENIDA DE NUEVO</p>
          <h1>Entra a tu taller</h1>
          <p>Tus ventas, gastos y materiales te esperan.</p>
        </div>
        <form onSubmit={submit}>
          {!configured && (
            <div className="login-error">
              Falta configurar Supabase en las variables de entorno del
              despliegue.
            </div>
          )}
          <label>
            Usuario
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </label>
          <label>
            Contraseña
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button className="primary" disabled={loading || !configured}>
            <LockKeyhole />
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
        <p className="login-note">Acceso privado protegido por Supabase</p>
      </section>
      <div className="login-decoration">
        <img src="/maja-logo.jpg" alt="Maja Tejidos, artesanía y amor" />
        <p>
          Un espacio tranquilo para que tus números estén tan bien tejidos como
          tus creaciones.
        </p>
      </div>
    </main>
  );
}
function Nav({
  icon,
  label,
  page,
  select,
  special = false,
}: {
  icon: React.ReactNode;
  label: Page;
  page: Page;
  select: (p: Page) => void;
  special?: boolean;
}) {
  return (
    <button
      className={`nav-item ${page === label ? "active" : ""} ${special ? "special" : ""}`}
      onClick={() => select(label)}
    >
      {icon}
      <span>{label}</span>
      {special && <span className="ai-dot" />}
    </button>
  );
}
function Dashboard({
  store,
  go,
  open,
}: {
  store: Store;
  go: (p: Page) => void;
  open: (m: "sale" | "expense") => void;
}) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = new Intl.DateTimeFormat("es-EC", { month: "long" })
    .format(now)
    .toUpperCase();
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - (7 - index) * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const total = store.sales
      .filter((sale) => {
        const saleDate = new Date(`${sale.date}T12:00:00`);
        return saleDate >= start && saleDate <= end;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);
    return {
      label: `${start.getDate()} ${new Intl.DateTimeFormat("es-EC", { month: "short" }).format(start)}`,
      total,
    };
  });
  const chartMax = Math.max(...weeks.map((week) => week.total), 1);
  const sales = store.sales.filter((s) => s.date.slice(0, 7) === monthKey),
    exps = store.expenses.filter((e) => e.date.slice(0, 7) === monthKey),
    income = sales.reduce((a, s) => a + s.amount, 0),
    expenses = exps.reduce((a, e) => a + e.amount, 0),
    profit = income - expenses;
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">RESUMEN DE {monthName}</p>
          <h1>
            Todo va tomando forma <span>✦</span>
          </h1>
          <p>Mira cómo está creciendo tu taller este mes.</p>
        </div>
        <button className="primary" onClick={() => open("sale")}>
          <Plus />
          Registrar venta
        </button>
      </section>
      <section className="stats-grid">
        <Stat
          title="Ingresos"
          value={money(income)}
          note={`${sales.length} ventas este mes`}
          icon={<ArrowUpRight />}
          tone="green"
        />
        <Stat
          title="Gastos"
          value={money(expenses)}
          note="Lana, herramientas y más"
          icon={<ArrowDownRight />}
          tone="orange"
        />
        <Stat
          title="Ganancia"
          value={money(profit)}
          note={
            income
              ? `${Math.round((profit / income) * 100)}% de margen`
              : "Sin ventas aún"
          }
          icon={<TrendingUp />}
          tone="purple"
          featured
        />
      </section>
      <section className="dashboard-grid">
        <div className="card chart-card">
          <div className="card-title">
            <div>
              <h2>Movimiento de tu negocio</h2>
              <p>Ingresos de las últimas 8 semanas</p>
            </div>
            {weeks.at(-1)!.total > 0 && (
              <span className="trend">
                <ArrowUpRight /> {money(weeks.at(-1)!.total)}
              </span>
            )}
          </div>
          {weeks.every((week) => week.total === 0) ? (
            <div className="chart-empty">
              <TrendingUp />
              <strong>Aún no hay ventas</strong>
              <span>Registra una venta para empezar a ver tu progreso.</span>
            </div>
          ) : (
            <div className="chart">
              <div className="y-axis">
                <span>{money(chartMax)}</span>
                <span>{money(chartMax * 0.66)}</span>
                <span>{money(chartMax * 0.33)}</span>
                <span>$0</span>
              </div>
              <div className="bars">
                {weeks.map((week) => (
                  <div className="bar-wrap" key={week.label}>
                    <div
                      className="bar"
                      style={{ height: `${(week.total / chartMax) * 100}%` }}
                    />
                    <small>{week.label}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card ai-card">
          <div className="ai-head">
            <span>
              <Bot />
            </span>
            <div>
              <h2>Una mirada a tus números</h2>
              <small>Preparado por tu contador IA</small>
            </div>
          </div>
          <p>
            {sales.length === 0 && exps.length === 0
              ? "Todavía no hay movimientos este mes. Registra tu primera venta o gasto para comenzar el análisis."
              : profit >= 0
                ? `Este mes llevas ${money(profit)} de ganancia. Tus ventas están cubriendo bien los gastos.`
                : "Tus gastos superan las ventas este mes. Revisemos precios y compras."}
          </p>
          <div className="insight">
            <Sparkles />
            <span>
              {income
                ? `Por cada $10 que vendes, te quedan ${money((profit / income) * 10)} después de gastos.`
                : "Registra tu primera venta para recibir recomendaciones."}
            </span>
          </div>
          <button className="text-button" onClick={() => go("Mi contador IA")}>
            Ver análisis completo <ArrowRight />
          </button>
        </div>
      </section>
      <section className="dashboard-grid lower">
        <div className="card recent-card">
          <div className="card-title">
            <div>
              <h2>Ventas recientes</h2>
              <p>Los últimos pedidos de tu taller</p>
            </div>
            <button className="text-button" onClick={() => go("Ventas")}>
              Ver todas <ArrowRight />
            </button>
          </div>
          <SalesTable sales={store.sales.slice(0, 4)} />
        </div>
        <div className="card quick-card">
          <h2>Acciones rápidas</h2>
          <p>Registra lo que pasa en tu taller.</p>
          <button onClick={() => open("sale")}>
            <span className="quick-icon sale">
              <ShoppingBag />
            </span>
            <span>
              <strong>Nueva venta</strong>
              <small>Anota un pedido entregado</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => open("expense")}>
            <span className="quick-icon expense">
              <ReceiptText />
            </span>
            <span>
              <strong>Nuevo gasto</strong>
              <small>Lana, crochet o materiales</small>
            </span>
            <ChevronRight />
          </button>
        </div>
      </section>
    </>
  );
}
function Stat({
  title,
  value,
  note,
  icon,
  tone,
  featured = false,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tone: string;
  featured?: boolean;
}) {
  return (
    <div className={`stat card ${featured ? "featured" : ""}`}>
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <p>{title}</p>
        <h3>{value}</h3>
        <small>{note}</small>
      </div>
    </div>
  );
}
function PageHeader({
  eyebrow,
  title,
  subtitle,
  button,
  onClick,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <section className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <button className="primary" onClick={onClick}>
        <Plus />
        {button}
      </button>
    </section>
  );
}
function SalesPage({
  store,
  open,
  remove,
}: {
  store: Store;
  open: () => void;
  remove: (id: number) => void;
}) {
  const total = store.sales.reduce((a, s) => a + s.amount, 0);
  return (
    <>
      <PageHeader
        eyebrow="TUS PEDIDOS"
        title="Ventas"
        subtitle="Cada pieza vendida cuenta una historia."
        button="Nueva venta"
        onClick={open}
      />
      <section className="mini-stats">
        <div>
          <small>Total vendido</small>
          <strong>{money(total)}</strong>
        </div>
        <div>
          <small>Pedidos</small>
          <strong>{store.sales.length}</strong>
        </div>
        <div>
          <small>Por cobrar</small>
          <strong>
            {money(
              store.sales
                .filter((s) => s.status === "Pendiente")
                .reduce((a, s) => a + s.amount, 0),
            )}
          </strong>
        </div>
      </section>
      <div className="card data-card">
        <div className="card-title">
          <div>
            <h2>Historial de ventas</h2>
            <p>Todos tus pedidos registrados</p>
          </div>
          <button className="secondary">
            <Download />
            Exportar
          </button>
        </div>
        <SalesTable sales={store.sales} onDelete={remove} />
      </div>
    </>
  );
}
function SalesTable({
  sales,
  onDelete,
}: {
  sales: Sale[];
  onDelete?: (id: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th className="right">Total</th>
            {onDelete && <th className="right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 && (
            <tr>
              <td colSpan={onDelete ? 6 : 5} className="empty-cell">
                No hay ventas registradas todavía.
              </td>
            </tr>
          )}
          {sales.map((s) => (
            <tr key={s.id}>
              <td data-label="Producto">
                <strong>{s.product}</strong>
              </td>
              <td data-label="Cliente">{s.customer}</td>
              <td data-label="Fecha">{dateLabel(s.date)}</td>
              <td data-label="Estado">
                <span className={`status ${s.status.toLowerCase()}`}>
                  {s.status}
                </span>
              </td>
              <td className="right" data-label="Total">
                <strong>{money(s.amount)}</strong>
              </td>
              {onDelete && (
                <td className="right action-cell" data-label="Acciones">
                  <button
                    className="delete-button"
                    onClick={() => onDelete(s.id)}
                    aria-label={`Eliminar venta de ${s.product}`}
                    title="Eliminar venta"
                  >
                    <Trash2 />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ExpensesPage({ store, open }: { store: Store; open: () => void }) {
  const grouped = store.expenses.reduce<Record<string, number>>(
    (a, e) => ({ ...a, [e.category]: (a[e.category] || 0) + e.amount }),
    {},
  );
  return (
    <>
      <PageHeader
        eyebrow="LO QUE INVIERTES"
        title="Gastos"
        subtitle="Ten claro cuánto cuesta crear cada pieza."
        button="Nuevo gasto"
        onClick={open}
      />
      <section className="category-row">
        {Object.entries(grouped).map(([k, v]) => (
          <div className="category-pill" key={k}>
            <span>{k}</span>
            <strong>{money(v)}</strong>
          </div>
        ))}
      </section>
      <div className="card data-card">
        <div className="card-title">
          <div>
            <h2>Compras y gastos</h2>
            <p>Materiales, herramientas y otros</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th className="right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {store.expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    No hay gastos registrados todavía.
                  </td>
                </tr>
              )}
              {store.expenses.map((e) => (
                <tr key={e.id}>
                  <td data-label="Descripción">
                    <strong>{e.description}</strong>
                  </td>
                  <td data-label="Categoría">
                    <span className="soft-tag">{e.category}</span>
                  </td>
                  <td data-label="Fecha">{dateLabel(e.date)}</td>
                  <td className="right" data-label="Valor">
                    <strong>{money(e.amount)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
function CustomersPage({
  store,
  open,
  remove,
}: {
  store: Store;
  open: () => void;
  remove: (id: number) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="TU COMUNIDAD"
        title="Clientes"
        subtitle="Las personas que eligen tus creaciones."
        button="Nuevo cliente"
        onClick={open}
      />
      <section className="customer-grid">
        {store.customers.length === 0 && (
          <div className="card empty-panel">
            <Users />
            <strong>Aún no hay clientes</strong>
            <span>
              Los clientes aparecerán aquí al registrarlos o crear una venta.
            </span>
          </div>
        )}
        {store.customers.map((c, i) => (
          <article className="card customer-card" key={c.id}>
            <button
              className="delete-button card-delete"
              onClick={() => remove(c.id)}
              aria-label={`Eliminar cliente ${c.name}`}
              title="Eliminar cliente"
            >
              <Trash2 />
            </button>
            <div className={`customer-avatar c${i % 4}`}>
              {c.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <h3>{c.name}</h3>
            <p>{c.phone || "Sin teléfono"}</p>
            <div>
              <span>
                <small>Pedidos</small>
                <strong>{c.orders}</strong>
              </span>
              <span>
                <small>Total</small>
                <strong>{money(c.total)}</strong>
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
function InventoryPage({
  store,
  open,
  remove,
}: {
  store: Store;
  open: () => void;
  remove: (id: number) => void;
}) {
  const value = store.yarn.reduce((a, y) => a + y.units * y.cost, 0);
  return (
    <>
      <PageHeader
        eyebrow="TUS MATERIALES"
        title="Inventario de lana"
        subtitle="Que nunca te falte el color que necesitas."
        button="Agregar lana"
        onClick={open}
      />
      <section className="mini-stats">
        <div>
          <small>Ovillos disponibles</small>
          <strong>{store.yarn.reduce((a, y) => a + y.units, 0)}</strong>
        </div>
        <div>
          <small>Valor del inventario</small>
          <strong>{money(value)}</strong>
        </div>
        <div>
          <small>Stock bajo</small>
          <strong>{store.yarn.filter((y) => y.units <= y.min).length}</strong>
        </div>
      </section>
      <section className="inventory-grid">
        {store.yarn.length === 0 && (
          <div className="card empty-panel">
            <Package />
            <strong>Tu inventario está vacío</strong>
            <span>Agrega los ovillos disponibles para controlar el stock.</span>
          </div>
        )}
        {store.yarn.map((y, i) => (
          <article className="card yarn-card" key={y.id}>
            <div className={`yarn-ball y${i % 4}`}>〰</div>
            <div>
              <h3>{y.name}</h3>
              <p>{y.color}</p>
              <span className={y.units <= y.min ? "low-stock" : ""}>
                {y.units} ovillos {y.units <= y.min && "· Stock bajo"}
              </span>
            </div>
            <strong>
              {money(y.cost)}
              <small> / ud.</small>
            </strong>
            <button
              className="delete-button"
              onClick={() => remove(y.id)}
              aria-label={`Eliminar ${y.name} ${y.color}`}
              title="Eliminar del inventario"
            >
              <Trash2 />
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
function AIPage({ store }: { store: Store }) {
  const income = store.sales.reduce((a, s) => a + s.amount, 0),
    expenses = store.expenses.reduce((a, e) => a + e.amount, 0),
    profit = income - expenses,
    avg = income / (store.sales.length || 1),
    top = [...store.sales].sort(
      (a, b) => b.amount - b.cost - (a.amount - a.cost),
    )[0];
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [loading, setLoading] = useState(false),
    [aiStatus, setAiStatus] = useState<"gemini" | "local" | null>(null);
  const localAnswer = (rawQuestion: string) => {
    const q = rawQuestion.toLowerCase();
    let a = `Hasta hoy has vendido ${money(income)} y gastado ${money(expenses)}. Tu resultado es ${money(profit)}.`;
    if (q.includes("precio") || q.includes("cobrar"))
      a = `Tu venta promedio es ${money(avg)}. Suma materiales, horas de trabajo y al menos un 30% de margen antes de fijar el precio.`;
    if (q.includes("lana") || q.includes("gasto"))
      a = `Has registrado ${money(expenses)} en gastos. La lana representa ${money(store.expenses.filter((x) => x.category === "Lana").reduce((s, x) => s + x.amount, 0))}.`;
    if (q.includes("ganancia") || q.includes("gané"))
      a = `Tu resultado registrado es ${money(profit)}. Esto considera compras y gastos, pero todavía no asigna tus horas de trabajo.`;
    return a;
  };
  const ask = async (e: FormEvent) => {
    e.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          context: {
            moneda: "USD",
            pais: "Ecuador",
            resumen: { ingresos: income, gastos: expenses, resultado: profit },
            ventas: store.sales,
            gastos: store.expenses,
            clientes: store.customers,
            inventarioDeLana: store.yarn,
          },
        }),
      });
      const payload = (await response.json()) as {
        answer?: string;
        error?: string;
      };
      if (!response.ok || !payload.answer)
        throw new Error(payload.error || "Gemini no pudo responder.");
      setAnswer(payload.answer);
      setAiStatus("gemini");
      setQuestion("");
    } catch {
      setAnswer(
        `${localAnswer(currentQuestion)} No pude conectar con Gemini, así que usé el análisis local.`,
      );
      setAiStatus("local");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <section className="page-heading ai-page-head">
        <div>
          <p className="eyebrow">TU NEGOCIO, EXPLICADO FÁCIL</p>
          <h1>
            Mi contador IA <Sparkles />
          </h1>
          <p>Pregúntame sobre tus ventas, gastos y precios.</p>
        </div>
      </section>
      <section className="ai-summary">
        <div className="ai-orb">
          <Bot />
        </div>
        <div>
          <p>Hola, Maja. Revisé los números de tu taller.</p>
          <h2>
            {store.sales.length === 0 && store.expenses.length === 0
              ? "Comencemos con tu primer registro."
              : profit >= 0
                ? "Tu negocio está dejando ganancia."
                : "Hay que ajustar algunos números."}
          </h2>
          <p>
            {store.sales.length === 0 && store.expenses.length === 0
              ? "Cuando registres ventas y gastos podré explicarte cómo va tu taller."
              : profit >= 0
                ? `Después de tus gastos registrados te quedan ${money(profit)}. Vas por buen camino.`
                : `Te faltan ${money(Math.abs(profit))} en ventas para cubrir lo invertido.`}
          </p>
        </div>
      </section>
      <section className="insights-grid">
        <article className="card insight-card">
          <CircleDollarSign />
          <small>Resultado actual</small>
          <h3>{money(profit)}</h3>
          <p>
            {income
              ? `${Math.round((profit / income) * 100)}% sobre tus ventas`
              : "Registra ventas para calcularlo"}
          </p>
        </article>
        <article className="card insight-card">
          <WalletCards />
          <small>Venta promedio</small>
          <h3>{money(avg)}</h3>
          <p>Por cada pedido entregado</p>
        </article>
        <article className="card insight-card">
          <TrendingUp />
          <small>Pieza más rentable</small>
          <h3>{top?.product || "—"}</h3>
          <p>
            {top
              ? `${money(top.amount - top.cost)} antes de otros gastos`
              : "Aún sin datos"}
          </p>
        </article>
      </section>
      <section className="card ask-card">
        <div>
          <Sparkles />
          <span>
            <h2>Pregúntale a tu contador</h2>
            <p>Respuestas basadas en lo que has registrado.</p>
          </span>
        </div>
        {answer && (
          <div className="ai-answer">
            <span className={`answer-source ${aiStatus}`}>
              {aiStatus === "gemini" ? "Gemini" : "Análisis local"}
            </span>
            {answer}
          </div>
        )}
        <form onSubmit={ask}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ej: ¿Cuánto gané? ¿Estoy cobrando bien?"
            required
          />
          <button className="primary" disabled={loading}>
            {loading ? "Analizando…" : "Preguntar"} <ArrowRight />
          </button>
        </form>
        <div className="suggestions">
          <button onClick={() => setQuestion("¿Cuánto gasté en lana?")}>
            ¿Cuánto gasté en lana?
          </button>
          <button onClick={() => setQuestion("¿Estoy cobrando bien?")}>
            ¿Estoy cobrando bien?
          </button>
          <button onClick={() => setQuestion("¿Cuál es mi ganancia?")}>
            ¿Cuál es mi ganancia?
          </button>
        </div>
      </section>
      <p className="disclaimer">
        Este asistente ofrece orientación con tus registros. Para impuestos,
        consulta a un profesional de tu país.
      </p>
    </>
  );
}
function EntryModal({
  type,
  store,
  update,
  close,
}: {
  type: "sale" | "expense" | "customer" | "yarn";
  store: Store;
  update: React.Dispatch<React.SetStateAction<Store>>;
  close: () => void;
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      n = Date.now();
    if (type === "sale") {
      const sale: Sale = {
        id: n,
        date: String(f.get("date")),
        product: String(f.get("product")),
        customer: String(f.get("customer")),
        amount: Number(f.get("amount")),
        cost: Number(f.get("cost")),
        status: String(f.get("status")) as Sale["status"],
      };
      update((s) => {
        const found = s.customers.find(
          (c) => c.name.toLowerCase() === sale.customer.toLowerCase(),
        );
        const customers = found
          ? s.customers.map((c) =>
              c.id === found.id
                ? { ...c, orders: c.orders + 1, total: c.total + sale.amount }
                : c,
            )
          : [
              ...s.customers,
              {
                id: n,
                name: sale.customer,
                phone: "",
                orders: 1,
                total: sale.amount,
              },
            ];
        return { ...s, sales: [sale, ...s.sales], customers };
      });
    }
    if (type === "expense") {
      const expense: Expense = {
        id: n,
        date: String(f.get("date")),
        description: String(f.get("description")),
        category: String(f.get("category")) as Expense["category"],
        amount: Number(f.get("amount")),
      };
      update((s) => ({ ...s, expenses: [expense, ...s.expenses] }));
    }
    if (type === "customer")
      update((s) => ({
        ...s,
        customers: [
          {
            id: n,
            name: String(f.get("name")),
            phone: String(f.get("phone")),
            orders: 0,
            total: 0,
          },
          ...s.customers,
        ],
      }));
    if (type === "yarn")
      update((s) => ({
        ...s,
        yarn: [
          ...s.yarn,
          {
            id: n,
            name: String(f.get("name")),
            color: String(f.get("color")),
            units: Number(f.get("units")),
            min: Number(f.get("min")),
            cost: Number(f.get("cost")),
          },
        ],
      }));
    close();
  };
  const titles = {
    sale: "Registrar una venta",
    expense: "Registrar un gasto",
    customer: "Agregar cliente",
    yarn: "Agregar lana",
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">NUEVO REGISTRO</p>
            <h2>{titles[type]}</h2>
          </div>
          <button onClick={close}>
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          {type === "sale" && (
            <>
              <label>
                Producto
                <input name="product" required placeholder="Ej: Bolso tejido" />
              </label>
              <div className="form-row">
                <label>
                  Cliente
                  <input
                    name="customer"
                    required
                    list="customers"
                    placeholder="Nombre del cliente"
                  />
                  <datalist id="customers">
                    {store.customers.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </datalist>
                </label>
                <label>
                  Fecha
                  <input
                    name="date"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Valor de venta
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </label>
                <label>
                  Costo de materiales
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </label>
              </div>
              <label>
                Estado
                <select name="status">
                  <option>Pagado</option>
                  <option>Pendiente</option>
                </select>
              </label>
            </>
          )}
          {type === "expense" && (
            <>
              <label>
                ¿Qué compraste?
                <input
                  name="description"
                  required
                  placeholder="Ej: 6 ovillos de algodón"
                />
              </label>
              <div className="form-row">
                <label>
                  Categoría
                  <select name="category">
                    <option>Lana</option>
                    <option>Herramientas</option>
                    <option>Empaque</option>
                    <option>Otro</option>
                  </select>
                </label>
                <label>
                  Fecha
                  <input
                    name="date"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </label>
              </div>
              <label>
                Valor
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </label>
            </>
          )}
          {type === "customer" && (
            <>
              <label>
                Nombre
                <input name="name" required />
              </label>
              <label>
                Teléfono
                <input name="phone" placeholder="099 000 0000" />
              </label>
            </>
          )}
          {type === "yarn" && (
            <>
              <div className="form-row">
                <label>
                  Tipo de lana
                  <input name="name" required />
                </label>
                <label>
                  Color
                  <input name="color" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Cantidad de ovillos
                  <input name="units" type="number" min="0" required />
                </label>
                <label>
                  Avisar cuando queden
                  <input
                    name="min"
                    type="number"
                    min="0"
                    defaultValue="2"
                    required
                  />
                </label>
              </div>
              <label>
                Costo por ovillo
                <input name="cost" type="number" step="0.01" min="0" required />
              </label>
            </>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>
              Cancelar
            </button>
            <button className="primary">Guardar registro</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default App;
