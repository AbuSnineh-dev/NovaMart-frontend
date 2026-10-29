"use client";
import {
  useState,
  useEffect,
  useCallback,
  useId,
  cloneElement,
  FormEvent,
  ReactNode,
  ReactElement,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Heart,
  UserRound,
  Search,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Minus,
  X,
  Menu,
  Check,
  Package,
  Truck,
  ShieldCheck,
  Headphones,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import {
  api,
  Product,
  Category,
  User,
  Cart,
  Order,
  money,
  transitions,
} from "@/lib/api";
const photos = [
  "9a3471fcfbeff4191afa2366d2419966",
  "bc284b6ccb94bfe5dbd036ec8d8ab761",
  "21f2faab2a6822fc57110d3ee8f25a61",
  "595b0f9e0999e89eae08f023cb24c16b",
  "edb9d3e9d2b976c3f30fc145c308f563",
  "19651f7a90c7abaaf25dbad319547d4a",
  "cf40ae31e1f62e7cad34f8adfd8649fd",
  "b7399fe7767d8da9036134243ea0bac4",
  "4dcd536547c0ee822cfc60c2bf5b65e8",
];
function Photo({ p }: { p: Product }) {
  const [broken, setBroken] = useState(false);
  return p.imageUrl && !broken ? (
    <img
      src={p.imageUrl}
      alt={p.name}
      onError={() => setBroken(true)}
      loading="lazy"
    />
  ) : (
    <div className="placeholder">
      <Package size={48} />
      <span>{p.name}</span>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}
export default function Store() {
  const path = usePathname(),
    router = useRouter();
  const isAdminLogin = path === "/admin/login";
  const [ar, setAr] = useState(false);
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [categories, setCategories] = useState<Category[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [cart, setCart] = useState<Cart>({ items: [] }),
    [orders, setOrders] = useState<Order[]>([]),
    [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [drawer, setDrawer] = useState(false),
    [menu, setMenu] = useState(false),
    [wishlist, setWishlist] = useState<string[]>([]);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [sort, setSort] = useState("new"),
    [price, setPrice] = useState("all"),
    [stock, setStock] = useState(false),
    [page, setPage] = useState(1),
    [tab, setTab] = useState("overview"),
    [register, setRegister] = useState(false),
    [editing, setEditing] = useState<Product | null | undefined>(undefined),
    [selectedOrder, setSelectedOrder] = useState<Order | null>(null),
    [quantity, setQuantity] = useState(1),
    [confirming, setConfirming] = useState<{
      text: string;
      action: () => Promise<void>;
    } | null>(null);
  const refreshCatalog = useCallback(async () => {
    const [cats] = await Promise.all([api<Category[]>("categories")]);
    setCategories(cats);
    let all: Product[] = [];
    let n = 1;
    for (;;) {
      const result = await api<{ data: Product[]; totalPages: number }>(
        `products?limit=100&page=${n}`,
      );
      all = all.concat(result.data);
      if (n >= result.totalPages) break;
      n++;
    }
    setProducts(all);
  }, []);
  const refreshCart = useCallback(
    async () => setCart(await api<Cart>("cart")),
    [],
  );
  const refreshOrders = useCallback(
    async (u: User) =>
      setOrders(
        await api<Order[]>(u.role === "admin" ? "admin/orders" : "orders"),
      ),
    [],
  );
  useEffect(() => {
    let alive = true;
    setAr(localStorage.getItem("nova_lang") === "ar");
    refreshCatalog()
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    api<User>("auth/me")
      .then((u) => {
        if (alive) setUser(u);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [refreshCatalog]);
  useEffect(() => {
    if (!user) {
      setCart({ items: [] });
      setOrders([]);
      setUsers([]);
      setWishlist([]);
      return;
    }
    try {
      setWishlist(
        JSON.parse(localStorage.getItem(`nova_wish_${user._id}`) || "[]"),
      );
    } catch {
      setWishlist([]);
    }
    if (user.role === "user") refreshCart().catch((e) => setError(e.message));
    refreshOrders(user).catch((e) => setError(e.message));
    if (user.role === "admin")
      api<User[]>("user")
        .then(setUsers)
        .catch((e) => setError(e.message));
  }, [user, refreshCart, refreshOrders]);
  useEffect(() => {
    setMenu(false);
    setError("");
    setPage(1);
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [path]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    localStorage.setItem("nova_lang", ar ? "ar" : "en");
  }, [ar]);
  const overlay =
    drawer || editing !== undefined || !!selectedOrder || !!confirming;
  useEffect(() => {
    if (!overlay) return;
    const before = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.querySelector<HTMLElement>("button,input,select")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        setEditing(undefined);
        setSelectedOrder(null);
        setConfirming(null);
      }
      if (e.key === "Tab" && dialog) {
        const items = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,select,textarea,a[href]",
          ),
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [overlay]);
  async function run(action: () => Promise<void>, message = "") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      if (message) setToast(message);
    } catch (e) {
      setError(
        (e as Error).message === "Invalid email or password."
          ? t(
              "Invalid email or password.",
              "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
            )
          : (e as Error).message,
      );
      if ((e as { status?: number }).status === 401) {
        setUser(null);
        router.push(path.startsWith("/admin") ? "/admin/login" : "/login");
      }
    } finally {
      setBusy(false);
    }
  }
  const count = cart.items.reduce((n, i) => n + i.quantity, 0),
    total = cart.items.reduce(
      (n, i) => n + (i.productId?.price || 0) * i.quantity,
      0,
    );
  function wish(id: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    const list = wishlist.includes(id)
      ? wishlist.filter((x) => x !== id)
      : [...wishlist, id];
    setWishlist(list);
    localStorage.setItem(`nova_wish_${user._id}`, JSON.stringify(list));
  }
  async function add(p: Product, q = 1) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "admin") {
      setError(
        t("Use a customer account to shop.", "استخدم حساب عميل للتسوّق."),
      );
      return;
    }
    await run(
      async () => {
        await api("cart/items", "POST", { productId: p._id, quantity: q });
        await refreshCart();
      },
      t("Added to your cart", "تمت الإضافة إلى السلة"),
    );
  }
  async function change(p: Product, q: number) {
    await run(async () => {
      await api(
        `cart/items/${p._id}`,
        q ? "PATCH" : "DELETE",
        q ? { quantity: q } : undefined,
      );
      await refreshCart();
    });
  }
  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setPrice("all");
    setStock(false);
    setPage(1);
  };
  const filtered = products
    .filter(
      (p) =>
        (!category || p.categoryId === category) &&
        p.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        (!stock || p.stockQuantity > 0) &&
        (price === "all" ||
          (price === "low"
            ? p.price < 25
            : price === "mid"
              ? p.price >= 25 && p.price <= 50
              : p.price > 50)),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : 0,
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const safePage = Math.min(page, pages);
  const product = products.find((p) => path === `/product/${p._id}`);
  const card = (p: Product) => (
    <article className="product-card" key={p._id}>
      <div className="product-art">
        <Link href={`/product/${p._id}`}>
          <Photo p={p} />
        </Link>
        <button
          className={`wish ${wishlist.includes(p._id) ? "selected" : ""}`}
          aria-label={`${t("Save", "احفظ")} ${p.name}`}
          aria-pressed={wishlist.includes(p._id)}
          onClick={() => wish(p._id)}
        >
          <Heart size={19} />
        </button>
        {!p.stockQuantity && (
          <span className="stock-tag">{t("Sold out", "نفد المخزون")}</span>
        )}
      </div>
      <div className="product-meta">
        <span className="eyebrow">
          {categories.find((c) => c._id === p.categoryId)?.name}
        </span>
        <Link href={`/product/${p._id}`}>
          <h3>{p.name}</h3>
        </Link>
        <div className="between">
          <strong>{money(p.price)}</strong>
          <button
            className="add-link"
            disabled={busy || !p.stockQuantity}
            onClick={() => add(p)}
          >
            {t("Add to cart", "أضف للسلة")} <Plus size={16} />
          </button>
        </div>
      </div>
    </article>
  );
  const empty = (heading: string, body: string) => (
    <div className="empty">
      <ShoppingBag size={44} />
      <h2>{heading}</h2>
      <p>{body}</p>
      <Link className="btn black" href="/shop">
        {t("Explore the collection", "تصفّح المجموعة")}
      </Link>
    </div>
  );
  const orderCard = (o: Order) => (
    <article key={o._id} className="order-card">
      <div className="between">
        <div>
          <span className="eyebrow">
            {t("Order", "طلب")} #{o._id.slice(-8).toUpperCase()}
          </span>
          <p>
            {new Date(o.createdAt).toLocaleDateString(ar ? "ar-JO" : "en-GB")}
          </p>
        </div>
        <span className={`status ${o.status.toLowerCase()}`}>{o.status}</span>
      </div>
      {o.items.map((i, n) => (
        <div key={n} className="between order-line">
          <span>
            {i.name} × {i.quantity}
          </span>
          <span>{money(i.price * i.quantity)}</span>
        </div>
      ))}
      <div className="between">
        <strong>{money(o.totalAmount)}</strong>
        <button className="text-button" onClick={() => setSelectedOrder(o)}>
          {t("View details", "عرض التفاصيل")} <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
  const gated = (child: ReactNode, admin = false) =>
    !ready ? (
      <div className="empty" role="status">
        {t("Loading your account…", "جارٍ تحميل حسابك…")}
      </div>
    ) : !user ? (
      <div className="empty">
        <UserRound size={44} />
        <h2>{t("Your account, all together.", "حسابك، كل شيء بمكان واحد.")}</h2>
        <Link className="btn black" href={admin ? "/admin/login" : "/login"}>
          {t("Log in to continue", "سجّل الدخول للمتابعة")}
        </Link>
      </div>
    ) : admin && user.role !== "admin" ? (
      empty(
        t("Access restricted", "الوصول مقيّد"),
        t(
          "This area is for store administrators.",
          "هذه الصفحة لإدارة المتجر.",
        ),
      )
    ) : (
      child
    );
  async function auth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await run(
      async () => {
        const email = String(data.get("email")).trim().toLowerCase(),
          Password = String(data.get("password"));
        if (register && !isAdminLogin)
          await api("auth/Register", "POST", {
            name: data.get("name"),
            email,
            Password,
            ...(data.get("phone") ? { phoneNumber: data.get("phone") } : {}),
          });
        await api(
          isAdminLogin ? "auth/admin-login" : "auth/customer-login",
          "POST",
          { email, Password },
        );
        const u = await api<User>("auth/me");
        setUser(u);
        router.push(u.role === "admin" ? "/admin" : "/shop");
      },
      t("Welcome to NovaMart", "أهلاً بك في نوفامارت"),
    );
  }
  async function saveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      description: f.get("description"),
      categoryId: f.get("categoryId"),
      price: Number(f.get("price")),
      stockQuantity: Number(f.get("stockQuantity")),
      imageUrl: f.get("imageUrl") || undefined,
    };
    await run(
      async () => {
        await api(
          editing ? `products/${editing._id}` : "products",
          editing ? "PATCH" : "POST",
          body,
        );
        await refreshCatalog();
        setEditing(undefined);
      },
      t("Product saved", "تم حفظ المنتج"),
    );
  }
  const title = (eyebrow: string, heading: string, description?: string) => (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{heading}</h1>
      {description && <p>{description}</p>}
    </div>
  );
  return (
    <div className="store" aria-busy={busy}>
      <div className="promo">
        {t("BLACK. RED. READY FOR EVERY DAY.", "أسود. أحمر. جاهز لكل يوم.")}
      </div>
      <header className="header">
        <Link href="/" className="logo" aria-label="NovaMart home">
          NOVA<span>MART</span>
        </Link>
        <nav className={menu ? "nav open" : "nav"}>
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>
            {t("Home", "الرئيسية")}
          </Link>
          <Link
            href="/shop"
            aria-current={path === "/shop" ? "page" : undefined}
          >
            {t("Shop", "المتجر")}
          </Link>
          <Link href="/about">{t("Our story", "قصتنا")}</Link>
          {user && (
            <Link href={user.role === "admin" ? "/admin" : "/orders"}>
              {user.role === "admin"
                ? t("Admin console", "لوحة الإدارة")
                : t("My orders", "طلباتي")}
            </Link>
          )}
        </nav>
        <div className="header-actions">
          <button className="lang" onClick={() => setAr(!ar)}>
            {ar ? "EN" : "العربية"}
          </button>
          <Link href="/wishlist" aria-label={t("Wishlist", "المفضلة")}>
            <Heart size={21} />
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            aria-label={t("Account", "الحساب")}
          >
            <UserRound size={21} />
          </Link>
          <button
            className="bag"
            aria-label={t("Open cart", "افتح السلة")}
            onClick={() => setDrawer(true)}
          >
            <ShoppingBag size={22} />
            {count > 0 && <span>{count}</span>}
          </button>
          <button
            className="mobile-menu"
            aria-label="Menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <a className="skip" href="#main">
        {t("Skip to content", "انتقل للمحتوى")}
      </a>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}
      <main id="main">
        {path === "/" && (
          <>
            <section className="hero">
              <div className="photo-wall" aria-hidden="true">
                {[0, 1, 2].map((row) => (
                  <div className="photo-track" key={row}>
                    {[...photos, ...photos].map((p, i) => (
                      <img key={i} src={`/images/${p}.jpg`} alt="" />
                    ))}
                  </div>
                ))}
              </div>
              <div className="hero-shade" />
              <div className="hero-copy">
                <span className="eyebrow">
                  {t(
                    "MOBILE ACCESSORIES. RECONSIDERED.",
                    "إكسسوارات الجوال. برؤية جديدة.",
                  )}
                </span>
                <h1>
                  {t("Dress your phone", "أناقة لهاتفك")}
                  <br />
                  <em>{t("in black and red.", "بالأسود والأحمر.")}</em>
                </h1>
                <p>
                  {t(
                    "Cases, chargers, cables and audio, chosen for the way you carry your phone.",
                    "أغلفة وشواحن وكابلات وصوتيات، اخترناها لتناسب يومك.",
                  )}
                </p>
                <div className="hero-buttons">
                  <Link className="btn red" href="/shop">
                    {t("Shop the collection", "تسوّق المجموعة")}
                    <ArrowUpRight size={18} />
                  </Link>
                  <button
                    className="btn outline-light"
                    onClick={() => {
                      setCategory(
                        categories.find((c) => /case/i.test(c.name))?._id || "",
                      );
                      router.push("/shop");
                    }}
                  >
                    {t("Discover cases", "اكتشف الأغلفة")}
                  </button>
                </div>
              </div>
              <div className="hero-index">
                <span>01 / EVERYDAY ESSENTIALS</span>
                <span>NOVA COLLECTION — 2026</span>
              </div>
            </section>
            <div className="marquee">
              {(categories.length
                ? categories.map((c) => c.name)
                : ["CASES", "CHARGERS", "CABLES", "AUDIO"]
              ).map((n, i) => (
                <span key={i}>
                  {n} <b>◆</b>
                </span>
              ))}
            </div>
            <section className="section container">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    {t("FIND YOUR EVERYDAY", "اختر ما يناسب يومك")}
                  </span>
                  <h2>
                    {t(
                      "Small things. Big difference.",
                      "تفاصيل صغيرة. فرق كبير.",
                    )}
                  </h2>
                </div>
                <Link className="text-button" href="/shop">
                  {t("Shop all", "تسوّق الكل")} <ArrowUpRight size={19} />
                </Link>
              </div>
              {loading ? (
                <div className="loading" role="status">
                  {t("Loading collection…", "جارٍ تحميل المجموعة…")}
                </div>
              ) : (
                <div className="category-grid">
                  {categories.map((c, i) => (
                    <button
                      className="category-tile"
                      key={c._id}
                      onClick={() => {
                        setCategory(c._id);
                        setPage(1);
                        router.push("/shop");
                      }}
                    >
                      <img
                        src={
                          products.find((p) => p.categoryId === c._id)
                            ?.imageUrl ||
                          `/images/${photos[i % photos.length]}.jpg`
                        }
                        alt=""
                      />
                      <div>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <h3>{c.name}</h3>
                        <ArrowUpRight size={22} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
            <section className="featured section container">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    {t("THE EVERYDAY EDIT", "مختارات لكل يوم")}
                  </span>
                  <h2>{t("Made to go with you.", "ترافقك أينما كنت.")}</h2>
                </div>
                <Link className="btn line" href="/shop">
                  {t("View collection", "عرض المجموعة")}{" "}
                  <ArrowRight size={17} />
                </Link>
              </div>
              <div className="product-grid">
                {products
                  .filter((p) => p.stockQuantity > 0)
                  .slice(0, 4)
                  .map(card)}
              </div>
            </section>
            <section className="manifesto">
              <span className="eyebrow">LESS NOISE. MORE NOVA.</span>
              <h2>
                {t("Your phone goes everywhere.", "هاتفك يرافقك في كل مكان.")}
                <br />
                <em>{t("Make it your own.", "اجعله يشبهك.")}</em>
              </h2>
              <Link href="/about" className="btn outline-light">
                {t("The NovaMart story", "قصة نوفامارت")}{" "}
                <ArrowUpRight size={18} />
              </Link>
            </section>
          </>
        )}
        {(path === "/shop" || path === "/wishlist") && (
          <section className="container section">
            {title(
              t("CURATED FOR YOUR EVERYDAY", "اخترناها ليومك"),
              path === "/wishlist"
                ? t("Your saved favourites.", "منتجاتك المفضلة.")
                : t("The collection.", "المجموعة."),
              t(
                "Considered design. Everyday essentials.",
                "تصميم مدروس. أساسيات لكل يوم.",
              ),
            )}
            {path === "/wishlist" ? (
              gated(
                <div className="product-grid">
                  {products.filter((p) => wishlist.includes(p._id)).map(card)}
                  {!wishlist.length &&
                    empty(
                      t("A little inspiration?", "تبحث عن الإلهام؟"),
                      t(
                        "Save the accessories you love. Saved on this device.",
                        "احفظ الإكسسوارات التي تحبها. تُحفظ على هذا الجهاز.",
                      ),
                    )}
                </div>,
              )
            ) : (
              <>
                <div className="catalog-toolbar">
                  <div className="search">
                    <Search size={19} />
                    <input
                      type="search"
                      aria-label={t("Search accessories", "ابحث عن إكسسوارات")}
                      placeholder={t(
                        "Search accessories…",
                        "ابحث عن إكسسوارات…",
                      )}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="new">
                      {t("Newest first", "الأحدث أولاً")}
                    </option>
                    <option value="low">
                      {t("Price: low to high", "السعر: من الأقل")}
                    </option>
                    <option value="high">
                      {t("Price: high to low", "السعر: من الأعلى")}
                    </option>
                    <option value="name">{t("Name", "الاسم")}</option>
                  </select>
                </div>
                <div className="catalog-layout">
                  <aside className="filters">
                    <h3>{t("Categories", "الفئات")}</h3>
                    <button
                      className={!category ? "filter active" : "filter"}
                      onClick={() => {
                        setCategory("");
                        setPage(1);
                      }}
                    >
                      {t("All accessories", "كل الإكسسوارات")}
                      <span>{products.length}</span>
                    </button>
                    {categories.map((c) => (
                      <button
                        className={
                          category === c._id ? "filter active" : "filter"
                        }
                        key={c._id}
                        onClick={() => {
                          setCategory(c._id);
                          setPage(1);
                        }}
                      >
                        {c.name}
                        <span>
                          {
                            products.filter((p) => p.categoryId === c._id)
                              .length
                          }
                        </span>
                      </button>
                    ))}
                    <h3>{t("Price range", "نطاق السعر")}</h3>
                    <select
                      aria-label="Price range"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">
                        {t("All prices", "كل الأسعار")}
                      </option>
                      <option value="low">Under $25</option>
                      <option value="mid">$25 – $50</option>
                      <option value="high">Over $50</option>
                    </select>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={stock}
                        onChange={(e) => {
                          setStock(e.target.checked);
                          setPage(1);
                        }}
                      />
                      {t("In stock only", "المتوفر فقط")}
                    </label>
                    <button className="text-button" onClick={clearFilters}>
                      {t("Clear filters", "مسح الفلاتر")}
                    </button>
                  </aside>
                  <div>
                    <div className="results-count">
                      {filtered.length} {t("accessories", "منتج")}
                    </div>
                    {loading ? (
                      <div role="status" className="loading">
                        {t("Loading…", "جارٍ التحميل…")}
                      </div>
                    ) : filtered.length ? (
                      <div className="product-grid catalog-grid">
                        {filtered
                          .slice((safePage - 1) * 8, safePage * 8)
                          .map(card)}
                      </div>
                    ) : (
                      <div className="empty">
                        <Search size={42} />
                        <h2>{t("Nothing matches.", "لا توجد نتائج.")}</h2>
                        <button className="btn black" onClick={clearFilters}>
                          {t("Clear filters", "مسح الفلاتر")}
                        </button>
                      </div>
                    )}
                    <div className="pagination">
                      <button
                        disabled={safePage <= 1}
                        onClick={() => setPage(safePage - 1)}
                      >
                        {t("Previous", "السابق")}
                      </button>
                      <span>
                        {safePage} / {pages}
                      </span>
                      <button
                        disabled={safePage >= pages}
                        onClick={() => setPage(safePage + 1)}
                      >
                        {t("Next", "التالي")}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
        {path.startsWith("/product/") &&
          (loading ? (
            <div className="empty" role="status">
              Loading…
            </div>
          ) : product ? (
            <section className="container section">
              <Link className="text-button back" href="/shop">
                ← {t("Back to collection", "العودة للمجموعة")}
              </Link>
              <div className="product-detail">
                <div className="detail-image">
                  <Photo p={product} />
                </div>
                <div className="detail-copy">
                  <span className="eyebrow">
                    {categories.find((c) => c._id === product.categoryId)?.name}
                  </span>
                  <h1>{product.name}</h1>
                  <div className="detail-price">{money(product.price)}</div>
                  <p>{product.description}</p>
                  <span className="inventory">
                    {product.stockQuantity
                      ? t(
                          `${product.stockQuantity} available`,
                          `متوفر ${product.stockQuantity}`,
                        )
                      : t("Sold out", "نفد المخزون")}
                  </span>
                  <div className="purchase-row">
                    <div className="quantity">
                      <button
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(quantity - 1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        disabled={quantity >= product.stockQuantity}
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      className="btn red"
                      disabled={busy || !product.stockQuantity}
                      onClick={() => add(product, quantity)}
                    >
                      {t("Add to cart", "أضف للسلة")}
                      <ShoppingBag size={18} />
                    </button>
                    <button
                      className="wish detail-wish"
                      aria-label="Save product"
                      onClick={() => wish(product._id)}
                    >
                      <Heart
                        fill={
                          wishlist.includes(product._id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="detail-note">
                    <ShieldCheck size={20} />
                    {t(
                      "Stock and price are confirmed at checkout.",
                      "يتم تأكيد المخزون والسعر عند إتمام الطلب.",
                    )}
                  </div>
                </div>
              </div>
              <div className="section-heading related">
                <h2>{t("More to make it yours.", "المزيد لأناقتك.")}</h2>
              </div>
              <div className="product-grid">
                {products
                  .filter(
                    (p) =>
                      p.categoryId === product.categoryId &&
                      p._id !== product._id,
                  )
                  .slice(0, 4)
                  .map(card)}
              </div>
            </section>
          ) : (
            empty(
              t("Product unavailable", "المنتج غير متاح"),
              t(
                "This accessory is no longer available.",
                "هذا المنتج غير متوفر حالياً.",
              ),
            )
          ))}
        {(path === "/login" || isAdminLogin) && (
          <section
            className={`auth-layout ${isAdminLogin ? "admin-auth" : ""}`}
          >
            <div className="auth-story">
              <span className="eyebrow">
                {isAdminLogin
                  ? "NOVAMART / ADMINISTRATION"
                  : "WELCOME TO NOVAMART"}
              </span>
              <h1>
                {isAdminLogin
                  ? t("Your store.", "متجرك.")
                  : t("Good things.", "أشياء جميلة.")}
                <br />
                <em>
                  {isAdminLogin
                    ? t("In your hands.", "بين إيديك.")
                    : t("All yours.", "كلها لك.")}
                </em>
              </h1>
              <p>
                {isAdminLogin
                  ? t(
                      "Manage products, inventory, orders and your team from one place.",
                      "أدر المنتجات والمخزون والطلبات والمستخدمين من مكان واحد.",
                    )
                  : t(
                      "Your favourites, your cart, your next everyday essential. All in one place.",
                      "مفضّلتك وسلّتك وكل ما تحتاجه ليومك، بمكان واحد.",
                    )}
              </p>
              {isAdminLogin ? (
                <LayoutDashboard
                  className="admin-auth-icon"
                  size={110}
                  strokeWidth={1}
                />
              ) : (
                <img src={`/images/${photos[5]}.jpg`} alt="Noir phone case" />
              )}
            </div>
            <div className="auth-form">
              {!isAdminLogin && (
                <div className="tabs">
                  <button
                    className={!register ? "active" : ""}
                    onClick={() => setRegister(false)}
                  >
                    {t("Log in", "تسجيل الدخول")}
                  </button>
                  <button
                    className={register ? "active" : ""}
                    onClick={() => setRegister(true)}
                  >
                    {t("Create account", "إنشاء حساب")}
                  </button>
                </div>
              )}
              <h2>
                {isAdminLogin
                  ? t("Administrator sign-in.", "تسجيل دخول الإدارة.")
                  : register
                    ? t("Make yourself at home.", "أهلاً بك بيننا.")
                    : t("Welcome back.", "أهلاً بعودتك.")}
              </h2>
              {isAdminLogin && (
                <p>
                  {t(
                    "Sign in with an administrator account to access the console.",
                    "سجّل الدخول بحساب أدمن للوصول إلى لوحة الإدارة.",
                  )}
                </p>
              )}
              <form
                key={isAdminLogin ? "admin-login" : "customer-login"}
                onSubmit={auth}
              >
                {register && !isAdminLogin && (
                  <Field label={t("Full name", "الاسم الكامل")}>
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={50}
                      autoComplete="name"
                    />
                  </Field>
                )}
                <Field label={t("Email address", "البريد الإلكتروني")}>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label={t("Password", "كلمة المرور")}>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={register && !isAdminLogin ? 8 : 1}
                    maxLength={register && !isAdminLogin ? 20 : undefined}
                    autoComplete={
                      register && !isAdminLogin
                        ? "new-password"
                        : "current-password"
                    }
                  />
                </Field>
                {register && !isAdminLogin && (
                  <>
                    <small>
                      {t("Use 8–20 characters.", "استخدم 8–20 حرفاً.")}
                    </small>
                    <Field label={t("Phone (optional)", "الهاتف (اختياري)")}>
                      <input type="tel" name="phone" autoComplete="tel" />
                    </Field>
                  </>
                )}
                <button className="btn red full" disabled={busy}>
                  {busy
                    ? t("Please wait…", "يرجى الانتظار…")
                    : register && !isAdminLogin
                      ? t("Create account", "إنشاء حساب")
                      : t("Log in", "تسجيل الدخول")}
                  <ArrowRight size={18} />
                </button>
              </form>
              <Link
                className="text-button portal-link"
                href={isAdminLogin ? "/login" : "/admin/login"}
              >
                {isAdminLogin
                  ? t("Customer sign-in", "تسجيل دخول العميل")
                  : t("Administrator sign-in", "تسجيل دخول الأدمن")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}
        {path === "/account" && (
          <section className="container section narrow">
            {title(
              t("YOUR NOVAMART", "حساب نوفامارت"),
              t("A space of your own.", "مساحتك الخاصة."),
            )}
            {gated(
              <>
                <form
                  className="panel"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(
                      async () => {
                        const updated = await api<User>(
                          "user/update",
                          "PATCH",
                          {
                            name: f.get("name"),
                            email: f.get("email"),
                            phoneNumber: f.get("phoneNumber"),
                          },
                        );
                        setUser(updated);
                      },
                      t("Profile updated", "تم تحديث الحساب"),
                    );
                  }}
                >
                  <Field label={t("Full name", "الاسم الكامل")}>
                    <input
                      name="name"
                      defaultValue={user?.name}
                      required
                      minLength={2}
                      maxLength={50}
                    />
                  </Field>
                  <Field label={t("Email address", "البريد الإلكتروني")}>
                    <input
                      name="email"
                      type="email"
                      defaultValue={user?.email}
                      required
                    />
                  </Field>
                  <Field label={t("Phone", "الهاتف")}>
                    <input
                      name="phoneNumber"
                      type="tel"
                      defaultValue={user?.phoneNumber}
                    />
                  </Field>
                  <button
                    className="btn black"
                    disabled={busy || user?.role === "admin"}
                  >
                    {t("Save changes", "حفظ التغييرات")}
                  </button>
                  {user?.role === "admin" && (
                    <p>
                      {t(
                        "Profile editing is available for customer accounts in this API.",
                        "تعديل الملف متاح لحسابات العملاء في هذا الـAPI.",
                      )}
                    </p>
                  )}
                </form>
                <button
                  className="text-button logout"
                  onClick={() =>
                    run(async () => {
                      await api("session", "DELETE");
                      setUser(null);
                      router.push("/");
                    })
                  }
                >
                  <LogOut size={18} />
                  {t("Log out", "تسجيل الخروج")}
                </button>
              </>,
            )}
          </section>
        )}
        {path === "/orders" && (
          <section className="container section narrow">
            {title(
              t("YOUR NOVAMART", "حساب نوفامارت"),
              t("Every order. One place.", "كل طلباتك. بمكان واحد."),
            )}
            {gated(
              orders.length ? (
                <div className="orders">{orders.map(orderCard)}</div>
              ) : (
                empty(
                  t("No orders yet.", "لا توجد طلبات بعد."),
                  t(
                    "Your next favourite is waiting.",
                    "منتجك المفضل بانتظارك.",
                  ),
                )
              ),
            )}
          </section>
        )}
        {path === "/checkout" && (
          <section className="container section">
            {title(
              t("THE LAST LITTLE STEP", "الخطوة الأخيرة"),
              t("Make it yours.", "اجعلها لك."),
            )}
            {gated(
              cart.items.length ? (
                <div className="checkout-layout">
                  <div className="panel">
                    <h2>{t("Review your order", "راجع طلبك")}</h2>
                    <p>
                      {t(
                        "Your account details will be linked to this order.",
                        "سيتم ربط بيانات حسابك بهذا الطلب.",
                      )}
                    </p>
                    <strong>{user?.name}</strong>
                    <p>{user?.email}</p>
                    <p>{user?.phoneNumber}</p>
                    <div className="notice">
                      <ShieldCheck />
                      {t(
                        "The backend currently supports order placement only. Shipping addresses and online payments are not collected.",
                        "الباك إند يدعم إنشاء الطلب فقط حالياً. لا يتم جمع عناوين الشحن أو الدفع الإلكتروني.",
                      )}
                    </div>
                    <p>
                      {t(
                        "Stock and current prices are checked when you confirm. No payment will be charged.",
                        "يتم التحقق من المخزون والأسعار الحالية عند التأكيد. لن يتم خصم أي مبلغ.",
                      )}
                    </p>
                    <Link className="text-button" href="/account">
                      {t("Edit contact details", "تعديل معلومات التواصل")}
                    </Link>
                  </div>
                  <div className="panel">
                    <h2>{t("Order summary", "ملخص الطلب")}</h2>
                    {cart.items.map((i, n) => (
                      <div className="between order-line" key={n}>
                        <span>
                          {i.productId?.name ||
                            t("Unavailable product", "منتج غير متاح")}{" "}
                          × {i.quantity}
                        </span>
                        <strong>
                          {money((i.productId?.price || 0) * i.quantity)}
                        </strong>
                      </div>
                    ))}
                    <div className="between checkout-total">
                      <span>{t("Total", "المجموع")}</span>
                      <strong>{money(total)}</strong>
                    </div>
                    <button
                      className="btn red full"
                      disabled={
                        busy ||
                        cart.items.some(
                          (i) =>
                            !i.productId ||
                            !i.productId.isActive ||
                            i.quantity > i.productId.stockQuantity,
                        )
                      }
                      onClick={() =>
                        run(
                          async () => {
                            const o = await api<Order>("orders", "POST");
                            setCart({ items: [] });
                            await refreshOrders(user!);
                            await refreshCatalog();
                            router.push(`/success/${o._id}`);
                          },
                          t(
                            "Order placed successfully",
                            "تم إنشاء الطلب بنجاح",
                          ),
                        )
                      }
                    >
                      {busy
                        ? t("Placing order…", "جارٍ إنشاء الطلب…")
                        : t("Confirm order", "تأكيد الطلب")}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                empty(
                  t("Your cart is empty.", "سلّتك فارغة."),
                  t(
                    "Choose your everyday essentials first.",
                    "اختر منتجاتك أولاً.",
                  ),
                )
              ),
            )}
          </section>
        )}
        {path.startsWith("/success/") && (
          <section className="container section">
            {gated(
              <div className="empty success">
                <div className="success-icon">
                  <Check size={40} />
                </div>
                <span className="eyebrow">THANK YOU</span>
                <h1>{t("Good choice. It’s yours.", "اختيار جميل. صار لك.")}</h1>
                <p>
                  {t("Order reference", "رقم الطلب")}: #
                  {path.split("/").at(-1)?.slice(-8).toUpperCase()}
                </p>
                <Link className="btn red" href="/orders">
                  {t("View my orders", "عرض طلباتي")}
                  <ArrowRight size={18} />
                </Link>
              </div>,
            )}
          </section>
        )}
        {path === "/admin" &&
          gated(
            <section className="container section admin">
              <div className="section-heading">
                {title(
                  t("NOVAMART / ADMINISTRATION", "نوفامارت / الإدارة"),
                  t("The store, at a glance.", "متجرك بلمحة."),
                )}
                <LayoutDashboard size={32} />
              </div>
              <div className="admin-tabs">
                {["overview", "products", "categories", "orders", "users"].map(
                  (x, i) => (
                    <button
                      key={x}
                      className={tab === x ? "active" : ""}
                      onClick={() => setTab(x)}
                    >
                      {t(
                        x,
                        [
                          "نظرة عامة",
                          "المنتجات",
                          "الفئات",
                          "الطلبات",
                          "المستخدمون",
                        ][i],
                      )}
                    </button>
                  ),
                )}
              </div>
              {tab === "overview" && (
                <>
                  <div className="stats">
                    {[
                      [
                        t("Revenue", "الإيرادات"),
                        money(
                          orders
                            .filter((o) => o.status !== "CANCELLED")
                            .reduce((n, o) => n + o.totalAmount, 0),
                        ),
                      ],
                      [t("Orders", "الطلبات"), orders.length],
                      [t("Products", "المنتجات"), products.length],
                      [
                        t("Low stock", "مخزون منخفض"),
                        products.filter((p) => p.stockQuantity <= 5).length,
                      ],
                    ].map(([label, value]) => (
                      <div className="stat" key={label}>
                        <span className="eyebrow">{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <h2>{t("Recent orders", "أحدث الطلبات")}</h2>
                  <div className="orders">
                    {orders.slice(0, 5).map(orderCard)}
                  </div>
                  <h2>{t("Stock to watch", "مخزون يحتاج متابعة")}</h2>
                  {products
                    .filter((p) => p.stockQuantity <= 5)
                    .map((p) => (
                      <div key={p._id} className="between order-line">
                        <span>{p.name}</span>
                        <strong>{p.stockQuantity}</strong>
                      </div>
                    ))}
                </>
              )}
              {tab === "products" && (
                <>
                  <div className="section-heading">
                    <p>
                      {products.length} {t("active products", "منتج نشط")}
                    </p>
                    <button
                      className="btn black"
                      onClick={() => setEditing(null)}
                    >
                      <Plus size={17} />
                      {t("Add product", "إضافة منتج")}
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t("Product", "المنتج")}</th>
                          <th>{t("Price", "السعر")}</th>
                          <th>{t("Stock", "المخزون")}</th>
                          <th>{t("Actions", "الإجراءات")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p._id}>
                            <td>
                              <div className="table-product">
                                <Photo p={p} />
                                <span>{p.name}</span>
                              </div>
                            </td>
                            <td>{money(p.price)}</td>
                            <td>{p.stockQuantity}</td>
                            <td>
                              <div className="row">
                                <button onClick={() => setEditing(p)}>
                                  {t("Edit", "تعديل")}
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() =>
                                    setConfirming({
                                      text: t(
                                        `Deactivate ${p.name}?`,
                                        `تعطيل ${p.name}؟`,
                                      ),
                                      action: async () => {
                                        await api(
                                          `products/${p._id}`,
                                          "DELETE",
                                        );
                                        await refreshCatalog();
                                      },
                                    })
                                  }
                                >
                                  {t("Deactivate", "تعطيل")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {tab === "categories" && (
                <>
                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const name = new FormData(form).get("name");
                      run(
                        async () => {
                          await api("categories", "POST", { name });
                          await refreshCatalog();
                          form.reset();
                        },
                        t("Category created", "تم إنشاء الفئة"),
                      );
                    }}
                  >
                    <input
                      type="text"
                      aria-label="New category name"
                      name="name"
                      placeholder={t("New category name", "اسم الفئة الجديدة")}
                      required
                    />
                    <button className="btn black" disabled={busy}>
                      {t("Add category", "إضافة فئة")}
                    </button>
                  </form>
                  {categories.map((c) => (
                    <form
                      className="category-edit"
                      key={c._id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = new FormData(e.currentTarget).get("name");
                        run(
                          async () => {
                            await api(`categories/${c._id}`, "PATCH", { name });
                            await refreshCatalog();
                          },
                          t("Category updated", "تم تحديث الفئة"),
                        );
                      }}
                    >
                      <input
                        type="text"
                        aria-label={`Category ${c.name}`}
                        name="name"
                        defaultValue={c.name}
                        required
                      />
                      <button disabled={busy}>{t("Save", "حفظ")}</button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setConfirming({
                            text: t(
                              `Delete category ${c.name}?`,
                              `حذف الفئة ${c.name}؟`,
                            ),
                            action: async () => {
                              await api(`categories/${c._id}`, "DELETE");
                              await refreshCatalog();
                            },
                          })
                        }
                      >
                        {t("Delete", "حذف")}
                      </button>
                    </form>
                  ))}
                </>
              )}
              {tab === "orders" && (
                <div className="orders">
                  {orders.map((o) => (
                    <div key={o._id}>
                      {orderCard(o)}
                      {transitions[o.status]?.length > 0 && (
                        <div className="order-actions">
                          <span>{t("Move to", "تغيير الحالة إلى")}</span>
                          {transitions[o.status].map((status) => (
                            <button
                              key={status}
                              disabled={busy}
                              onClick={() =>
                                setConfirming({
                                  text: t(
                                    `Change order to ${status}?`,
                                    `تغيير حالة الطلب إلى ${status}؟`,
                                  ),
                                  action: async () => {
                                    await api(
                                      `admin/orders/${o._id}/status`,
                                      "PATCH",
                                      { status },
                                    );
                                    await refreshOrders(user!);
                                    await refreshCatalog();
                                  },
                                })
                              }
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {tab === "users" && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Name", "الاسم")}</th>
                        <th>{t("Email", "البريد الإلكتروني")}</th>
                        <th>{t("Role", "الصلاحية")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              aria-label={`Role for ${u.name}`}
                              value={u.role}
                              disabled={busy || u._id === user?._id}
                              onChange={(e) => {
                                const role = e.target.value;
                                setConfirming({
                                  text: t(
                                    `Change ${u.name} to ${role}?`,
                                    `تغيير صلاحية ${u.name} إلى ${role}؟`,
                                  ),
                                  action: async () => {
                                    await api(`user/${u._id}/role`, "PATCH", {
                                      role,
                                    });
                                    setUsers(await api<User[]>("user"));
                                  },
                                });
                              }}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>,
            true,
          )}
        {path === "/about" && (
          <section className="container section about">
            {title(
              "THE NOVAMART STORY",
              t("Everyday. Anything but ordinary.", "كل يوم. بأسلوب استثنائي."),
            )}
            <div className="about-grid">
              <img src={`/images/${photos[5]}.jpg`} alt="NovaMart phone case" />
              <div>
                <h2>
                  {t(
                    "Small details. Considered choices.",
                    "تفاصيل صغيرة. خيارات مدروسة.",
                  )}
                </h2>
                <p>
                  {t(
                    "NovaMart brings together mobile accessories in a distinct palette of black, red and white. Protective cases, reliable charging, and audio for the moments in between.",
                    "يجمع نوفامارت إكسسوارات الجوال بألوان الأسود والأحمر والأبيض. أغلفة للحماية، شحن موثوق، وصوتيات ترافق لحظاتك.",
                  )}
                </p>
                <Link className="btn red" href="/shop">
                  {t("Meet the collection", "اكتشف المجموعة")}
                </Link>
              </div>
            </div>
          </section>
        )}
        {path === "/faq" && (
          <section className="container section narrow">
            {title(
              "A LITTLE HELP",
              t("Good questions. Clear answers.", "أسئلة مهمة. إجابات واضحة."),
            )}
            {[
              [
                t("Do I need an account?", "هل أحتاج حساباً؟"),
                t(
                  "Yes. Create an account to save your cart and view your orders across devices.",
                  "نعم، أنشئ حساباً لحفظ سلّتك ومتابعة الطلبات عبر الأجهزة.",
                ),
              ],
              [
                t("How do I track my order?", "كيف أتابع طلبي؟"),
                t(
                  "Open My orders to view your current order status and item details.",
                  "افتح طلباتي لعرض حالة الطلب وتفاصيله.",
                ),
              ],
              [
                t("Can I pay online?", "هل يمكن الدفع الإلكتروني؟"),
                t(
                  "Online payment is not yet supported. Confirming an order does not charge your card.",
                  "الدفع الإلكتروني غير متاح حالياً. تأكيد الطلب لا يخصم أي مبلغ.",
                ),
              ],
              [
                t("Where is my wishlist stored?", "أين تُحفظ مفضلتي؟"),
                t(
                  "Favourites are saved in this browser for your account. Your cart is saved on the server.",
                  "تُحفظ المفضلة في هذا المتصفح لحسابك. تُحفظ السلّة على الخادم.",
                ),
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        )}
        {![
          "/",
          "/shop",
          "/wishlist",
          "/login",
          "/admin/login",
          "/account",
          "/orders",
          "/checkout",
          "/admin",
          "/about",
          "/faq",
        ].includes(path) &&
          !path.startsWith("/product/") &&
          !path.startsWith("/success/") &&
          empty(
            t("Page not found.", "الصفحة غير موجودة."),
            t("Let’s get you back to the collection.", "لنعد إلى المجموعة."),
          )}
      </main>
      <section className="benefits">
        <div>
          <ShieldCheck />
          <span>{t("Considered quality", "جودة مدروسة")}</span>
        </div>
        <div>
          <Package />
          <span>{t("Everyday essentials", "أساسيات لكل يوم")}</span>
        </div>
        <div>
          <Truck />
          <span>{t("Follow every order", "تابع كل طلب")}</span>
        </div>
        <div>
          <Headphones />
          <Link href="/faq">{t("Here to help", "هنا لمساعدتك")}</Link>
        </div>
      </section>
      <footer>
        <div className="container footer-grid">
          <div>
            <Link href="/" className="logo">
              NOVA<span>MART</span>
            </Link>
            <p>
              {t(
                "Mobile accessories in black, red and white.",
                "إكسسوارات الجوال بالأسود والأحمر والأبيض.",
              )}
            </p>
          </div>
          <div>
            <span className="eyebrow">{t("EXPLORE", "اكتشف")}</span>
            <Link href="/shop">{t("The collection", "المجموعة")}</Link>
            <Link href="/wishlist">{t("Your favourites", "المفضلة")}</Link>
          </div>
          <div>
            <span className="eyebrow">{t("YOUR NOVAMART", "حسابك")}</span>
            <Link href="/account">{t("My account", "حسابي")}</Link>
            <Link href="/orders">{t("Track an order", "تتبّع طلباً")}</Link>
          </div>
          <div>
            <span className="eyebrow">{t("A LITTLE MORE", "المزيد")}</span>
            <Link href="/about">{t("Our story", "قصتنا")}</Link>
            <Link href="/faq">{t("FAQs", "الأسئلة الشائعة")}</Link>
            <button onClick={() => setAr(!ar)}>
              {ar ? "English" : "العربية"}
            </button>
          </div>
        </div>
        <div className="container copyright">
          <span>
            © 2026 NovaMart. {t("All rights reserved.", "جميع الحقوق محفوظة.")}
          </span>
          <span>MADE WITH INTENTION.</span>
        </div>
      </footer>
      {drawer && (
        <div className="overlay" onClick={() => setDrawer(false)}>
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("Your cart", "سلّتك")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <h2>
                {t("Your cart.", "سلّتك.")} <small>({count})</small>
              </h2>
              <button aria-label="Close cart" onClick={() => setDrawer(false)}>
                <X />
              </button>
            </div>
            <div className="drawer-body">
              {!user ? (
                <div className="empty">
                  <h3>
                    {t("Log in to see your cart.", "سجّل الدخول لعرض سلّتك.")}
                  </h3>
                  <Link
                    href="/login"
                    className="btn black"
                    onClick={() => setDrawer(false)}
                  >
                    {t("Log in", "تسجيل الدخول")}
                  </Link>
                </div>
              ) : cart.items.length ? (
                cart.items.map((i, n) => (
                  <div className="cart-line" key={n}>
                    {i.productId ? (
                      <>
                        <div className="cart-image">
                          <Photo p={i.productId} />
                        </div>
                        <div className="cart-info">
                          <strong>{i.productId.name}</strong>
                          <span>{money(i.productId.price)}</span>
                          <div className="between">
                            <div className="quantity">
                              <button
                                aria-label={`Decrease ${i.productId.name}`}
                                disabled={busy || i.quantity <= 1}
                                onClick={() =>
                                  change(i.productId!, i.quantity - 1)
                                }
                              >
                                <Minus size={14} />
                              </button>
                              <span>{i.quantity}</span>
                              <button
                                aria-label={`Increase ${i.productId.name}`}
                                disabled={
                                  busy ||
                                  i.quantity >= i.productId.stockQuantity
                                }
                                onClick={() =>
                                  change(i.productId!, i.quantity + 1)
                                }
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button
                              className="text-button"
                              disabled={busy}
                              onClick={() => change(i.productId!, 0)}
                            >
                              {t("Remove", "إزالة")}
                            </button>
                          </div>
                          {(!i.productId.isActive ||
                            i.quantity > i.productId.stockQuantity) && (
                            <small className="danger">
                              {t(
                                "Unavailable quantity. Please remove this item.",
                                "الكمية غير متاحة. يرجى إزالة المنتج.",
                              )}
                            </small>
                          )}
                        </div>
                      </>
                    ) : (
                      <p>
                        {t(
                          "An item is no longer available. Clear your cart to continue.",
                          "أحد المنتجات غير متاح. أفرغ السلة للمتابعة.",
                        )}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                empty(
                  t("Room for something good.", "مساحة لشيء جميل."),
                  t("Your cart is empty.", "سلّتك فارغة."),
                )
              )}
            </div>
            {cart.items.length > 0 && (
              <div className="drawer-footer">
                <div className="between">
                  <span>{t("Subtotal", "المجموع")}</span>
                  <strong>{money(total)}</strong>
                </div>
                <Link
                  className="btn red full"
                  href="/checkout"
                  onClick={() => setDrawer(false)}
                >
                  {t("Checkout", "إتمام الطلب")}
                  <ArrowRight size={18} />
                </Link>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await api("cart", "DELETE");
                      await refreshCart();
                    })
                  }
                >
                  {t("Clear cart", "إفراغ السلة")}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
      {editing !== undefined && (
        <div className="overlay" onClick={() => setEditing(undefined)}>
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Product editor"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <h2>
                {editing
                  ? t("Edit product", "تعديل منتج")
                  : t("New product", "منتج جديد")}
              </h2>
              <button
                aria-label="Close editor"
                onClick={() => setEditing(undefined)}
              >
                <X />
              </button>
            </div>
            <form className="drawer-body product-form" onSubmit={saveProduct}>
              <Field label={t("Name", "الاسم")}>
                <input name="name" required defaultValue={editing?.name} />
              </Field>
              <Field label={t("Category", "الفئة")}>
                <select
                  name="categoryId"
                  defaultValue={editing?.categoryId}
                  required
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Description", "الوصف")}>
                <textarea
                  name="description"
                  required
                  defaultValue={editing?.description}
                />
              </Field>
              <div className="two-col">
                <Field label={t("Price ($)", "السعر ($)")}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    required
                    defaultValue={editing?.price}
                  />
                </Field>
                <Field label={t("Stock", "المخزون")}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="stockQuantity"
                    required
                    defaultValue={editing?.stockQuantity}
                  />
                </Field>
              </div>
              <Field label={t("Image URL (optional)", "رابط الصورة (اختياري)")}>
                <input
                  name="imageUrl"
                  type="url"
                  defaultValue={editing?.imageUrl}
                />
              </Field>
              <button
                className="btn red full"
                disabled={busy || !categories.length}
              >
                {t("Save product", "حفظ المنتج")}
              </button>
            </form>
          </aside>
        </div>
      )}
      {selectedOrder && (
        <div
          className="overlay modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="between">
              <h2>{t("Order details", "تفاصيل الطلب")}</h2>
              <button
                aria-label="Close details"
                onClick={() => setSelectedOrder(null)}
              >
                <X />
              </button>
            </div>
            {orderCard(selectedOrder)}
            <p className="notice">
              {t(
                "Names and prices reflect the moment you ordered.",
                "الأسماء والأسعار محفوظة كما كانت عند الطلب.",
              )}
            </p>
            <div className="order-progress">
              {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map((s, i) => (
                <div
                  key={s}
                  className={
                    ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].indexOf(
                      selectedOrder.status,
                    ) >= i
                      ? "done"
                      : ""
                  }
                >
                  <span>{i + 1}</span>
                  <small>{s}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {confirming && (
        <div className="overlay modal-overlay">
          <section
            className="modal confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm action"
          >
            <h2>{confirming.text}</h2>
            <div className="row">
              <button
                className="btn line"
                disabled={busy}
                onClick={() => setConfirming(null)}
              >
                {t("Cancel", "تراجع")}
              </button>
              <button
                className="btn red"
                disabled={busy}
                onClick={() =>
                  run(
                    async () => {
                      await confirming.action();
                      setConfirming(null);
                    },
                    t("Changes saved", "تم حفظ التغييرات"),
                  )
                }
              >
                {t("Confirm", "تأكيد")}
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
