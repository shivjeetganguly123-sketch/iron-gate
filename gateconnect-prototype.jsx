import React, { useState, useMemo } from "react";
import {
  Search, Star, Heart, MessageCircle, Phone, ShoppingCart, ChevronRight,
  LayoutDashboard, Package, Boxes, Wallet, ShieldCheck, MapPin, Check,
  ArrowLeft, Plus, Minus, Hammer, Truck, ClipboardCheck, Factory, Home,
  Users, Store, X, BadgeCheck,
} from "lucide-react";

/* ----------------------------- design tokens ---------------------------- */
const C = {
  ink: "#0C1B33", ink2: "#13294B", steel: "#5C6B7E", steelLt: "#8A97A8",
  mist: "#EEF1F6", line: "#D8DEE7", accent: "#2E5AAC", accent2: "#3D74D6",
  amber: "#C77A12", ok: "#1F8A5B", white: "#FFFFFF",
};
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const font = { fontFamily: "'Segoe UI', system-ui, sans-serif" };

/* -------------------------------- mock data ----------------------------- */
const PRODUCTS = [
  { id: 1, title: "Premium Stainless Steel Main Gate", cat: "Stainless Steel Gate", mat: "SS 304",
    price: 50000, install: 3000, delivery: 2000, city: "Pune", rating: 4.7, reviews: 9,
    seller: "SteelCrafts Fabricators", finish: "Mirror", hw: "7ft × 12ft", tone: C.steel },
  { id: 2, title: "Modern Automated Sliding Gate", cat: "Sliding Gate", mat: "Mild Steel",
    price: 72000, install: 6000, delivery: 2500, city: "Pune", rating: 4.5, reviews: 14,
    seller: "SteelCrafts Fabricators", finish: "Powder Coated", hw: "6ft × 16ft", tone: C.ink2 },
  { id: 3, title: "Decorative Balcony Grill — Floral", cat: "Balcony Grill", mat: "Mild Steel",
    price: 14000, install: 1500, delivery: 800, city: "Pune", rating: 4.8, reviews: 22,
    seller: "SteelCrafts Fabricators", finish: "Matte", hw: "4ft × 8ft", tone: C.accent },
  { id: 4, title: "Heavy Compound Folding Gate", cat: "Folding Gate", mat: "Mild Steel",
    price: 86000, install: 7000, delivery: 3000, city: "Mumbai", rating: 4.4, reviews: 6,
    seller: "IronArt Works", finish: "Galvanized", hw: "8ft × 20ft", tone: C.steelLt },
  { id: 5, title: "Laser-Cut Window Grill Set", cat: "Window Grill", mat: "MS",
    price: 9500, install: 1200, delivery: 600, city: "Nagpur", rating: 4.6, reviews: 31,
    seller: "Vidarbha Fab", finish: "Matte Black", hw: "3ft × 4ft", tone: C.ink },
  { id: 6, title: "Designer Staircase Grill", cat: "Staircase Grill", mat: "SS + Glass",
    price: 38000, install: 4000, delivery: 1500, city: "Pune", rating: 4.9, reviews: 11,
    seller: "SteelCrafts Fabricators", finish: "Brushed", hw: "varies", tone: C.accent2 },
];
const CITIES = ["Pune", "Mumbai", "Nagpur", "Nashik", "Delhi", "Bengaluru"];
const STATUSES = ["Order Received","Seller Accepted","Measurement Scheduled","Manufacturing Started",
  "Manufacturing Completed","Ready For Delivery","Installation Scheduled","Installation Completed","Order Closed"];

/* ------------------------------ small pieces ---------------------------- */
const Thumb = ({ tone, h = 150, icon: Icon = Hammer }) => (
  <div style={{ height: h, background: `linear-gradient(135deg, ${tone} 0%, ${C.ink} 100%)`,
    display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.12,
      backgroundImage: "repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 16px)" }} />
    <Icon size={36} color="rgba(255,255,255,.85)" />
  </div>
);
const Stars = ({ r }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.amber, fontWeight: 600 }}>
    <Star size={14} fill={C.amber} color={C.amber} /> {r}
  </span>
);
const Btn = ({ children, onClick, kind = "primary", style = {}, ...p }) => {
  const base = { border: "none", borderRadius: 8, padding: "11px 18px", fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, transition: "all .15s", ...style };
  const kinds = {
    primary: { background: C.accent, color: "#fff" },
    dark: { background: C.ink, color: "#fff" },
    amber: { background: C.amber, color: "#fff" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
    wa: { background: "#1FA855", color: "#fff" },
  };
  return <button onClick={onClick} style={{ ...base, ...kinds[kind] }} {...p}>{children}</button>;
};
const Metric = ({ label, value, icon: Icon, accent }) => (
  <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, flex: 1, minWidth: 150 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: C.steel, fontSize: 13 }}>{label}</span>
      <Icon size={18} color={accent || C.accent} />
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 8 }}>{value}</div>
  </div>
);

/* ================================== APP ================================= */
export default function App() {
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [filterCat, setFilterCat] = useState("All");
  const [order, setOrder] = useState(null);
  const go = (v) => { setView(v); window.scrollTo?.(0, 0); };

  const filtered = useMemo(
    () => (filterCat === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === filterCat)),
    [filterCat]
  );
  const total = (p) => p.price + p.install + p.delivery;
  const addToCart = (p) => { if (!cart.find((c) => c.id === p.id)) setCart([...cart, { ...p, qty: 1 }]); go("cart"); };
  const toggleWish = (p) =>
    setWishlist((w) => (w.find((x) => x.id === p.id) ? w.filter((x) => x.id !== p.id) : [...w, p]));

  const placeOrder = (prod, addr) => {
    const t = total(prod);
    setOrder({ id: "GC-2026-000123", product: prod, total: t, advance: Math.round(t * 0.2),
      commission: Math.round(t * 0.05), payout: t - Math.round(t * 0.05), address: addr, stage: 3 });
    go("tracking");
  };

  /* --------------------------------- NAV -------------------------------- */
  const Nav = () => (
    <div style={{ background: C.ink, color: "#fff", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 20px", height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: C.accent,
            display: "grid", placeItems: "center" }}><ShieldCheck size={18} /></div>
          <div style={{ fontWeight: 700, letterSpacing: .3 }}>GateConnect <span style={{ color: C.accent2 }}>India</span></div>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center", fontSize: 14 }}>
          {[["Home","home"],["Browse Designs","listing"],["Sellers","sellerDash"],["Buyers","buyerDash"],["Admin","adminDash"]].map(([l,v]) => (
            <span key={v} onClick={() => go(v)} style={{ cursor: "pointer", color: view===v? C.accent2 : "#cfd6e2" }}>{l}</span>
          ))}
          <span onClick={() => go("cart")} style={{ cursor: "pointer", position: "relative" }}>
            <ShoppingCart size={18} />
            {cart.length>0 && <span style={{ position:"absolute", top:-8, right:-10, background:C.amber, borderRadius:10, fontSize:11, padding:"0 5px" }}>{cart.length}</span>}
          </span>
          <Btn kind="primary" onClick={() => go("registerBuyer")} style={{ padding: "7px 14px" }}>Register</Btn>
        </div>
      </div>
    </div>
  );

  /* --------------------------------- HOME ------------------------------- */
  const HomeView = () => (
    <div>
      <div style={{ background: `linear-gradient(120deg, ${C.ink} 0%, ${C.ink2} 60%, ${C.accent} 140%)`, color: "#fff" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "70px 20px 80px" }}>
          <div style={{ fontSize: 13, color: C.accent2, fontWeight: 600, letterSpacing: 1 }}>INDIA'S GATE & GRILL MARKETPLACE</div>
          <h1 style={{ fontSize: 44, margin: "12px 0 10px", lineHeight: 1.1, maxWidth: 720 }}>
            Manufacturers, fabricators & dealers — connected to buyers nationwide.
          </h1>
          <p style={{ color: "#c4cde0", maxWidth: 560, fontSize: 17 }}>
            Browse verified designs, pay a secure advance, and track manufacturing to installation in one place.
          </p>
          <div style={{ display: "flex", marginTop: 26, background: "#fff", borderRadius: 12, padding: 6, maxWidth: 560 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flex: 1, color: C.steel }}>
              <Search size={18} /><input placeholder="Search gates, grills, fabrication…" style={{ border: "none", outline: "none", width: "100%", fontSize: 15 }} />
            </div>
            <Btn kind="amber" onClick={() => go("listing")}>Search</Btn>
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 30, color: "#aebbd4", fontSize: 14 }}>
            <span><b style={{ color: "#fff" }}>1,200+</b> verified sellers</span>
            <span><b style={{ color: "#fff" }}>18k+</b> designs</span>
            <span><b style={{ color: "#fff" }}>5%</b> flat platform fee</span>
          </div>
        </div>
      </div>

      <Section title="Featured Designs" action={() => go("listing")}>
        <Grid>{PRODUCTS.slice(0, 3).map((p) => <Card key={p.id} p={p} />)}</Grid>
      </Section>

      <div style={{ background: C.mist }}>
        <Section title="Popular Cities">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {CITIES.map((c) => (
              <div key={c} onClick={() => go("listing")} style={{ background: "#fff", border: `1px solid ${C.line}`,
                borderRadius: 10, padding: "12px 18px", cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                <MapPin size={16} color={C.accent} /> {c}
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Why Choose Us">
        <Grid>
          {[["Verified sellers","KYC-checked GST & PAN for every fabricator.",ShieldCheck],
            ["Secure payments","Pay 20% advance online; balance through the platform.",Wallet],
            ["Live tracking","Follow your order across 9 stages to installation.",ClipboardCheck]].map(([t,d,Icon]) => (
            <div key={t} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 22, flex: 1 }}>
              <Icon size={26} color={C.accent} />
              <h3 style={{ margin: "12px 0 6px", color: C.ink }}>{t}</h3>
              <p style={{ color: C.steel, fontSize: 14, margin: 0 }}>{d}</p>
            </div>
          ))}
        </Grid>
      </Section>
      <Footer />
    </div>
  );

  const Section = ({ title, children, action }) => (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "44px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: C.ink, margin: 0, fontSize: 24 }}>{title}</h2>
        {action && <span onClick={action} style={{ color: C.accent, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>View all <ChevronRight size={16} /></span>}
      </div>
      {children}
    </div>
  );
  const Grid = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>{children}</div>;

  const Card = ({ p }) => {
    const wished = wishlist.find((x) => x.id === p.id);
    return (
      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ position: "relative" }}>
          <Thumb tone={p.tone} />
          <button onClick={() => toggleWish(p)} style={{ position: "absolute", top: 10, right: 10, border: "none",
            background: "rgba(255,255,255,.92)", borderRadius: 20, width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center" }}>
            <Heart size={16} color={wished ? "#D9376E" : C.steel} fill={wished ? "#D9376E" : "none"} />
          </button>
          <span style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(12,27,51,.85)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 6 }}>{p.cat}</span>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: C.ink, lineHeight: 1.3 }}>{p.title}</h3>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, color: C.steel, fontSize: 13 }}>
            <span><MapPin size={12} style={{ verticalAlign: -1 }} /> {p.city}</span><Stars r={p.rating} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>{inr(p.price)}</span>
            <Btn onClick={() => { setSelected(p); go("product"); }} style={{ padding: "8px 14px" }}>View</Btn>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------- LISTING ------------------------------ */
  const Listing = () => (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "30px 20px", display: "grid", gridTemplateColumns: "230px 1fr", gap: 24 }}>
      <aside style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, height: "fit-content" }}>
        <h3 style={{ marginTop: 0, color: C.ink, fontSize: 16 }}>Filters</h3>
        <div style={{ color: C.steel, fontSize: 12, fontWeight: 700, margin: "14px 0 6px" }}>CATEGORY</div>
        {["All", ...new Set(PRODUCTS.map((p) => p.cat))].map((c) => (
          <div key={c} onClick={() => setFilterCat(c)} style={{ padding: "7px 9px", borderRadius: 7, cursor: "pointer", fontSize: 14,
            background: filterCat === c ? C.mist : "transparent", color: filterCat === c ? C.ink : C.steel, fontWeight: filterCat === c ? 600 : 400 }}>{c}</div>
        ))}
        <div style={{ color: C.steel, fontSize: 12, fontWeight: 700, margin: "16px 0 8px" }}>PRICE / CITY / MATERIAL / RATING</div>
        <p style={{ color: C.steelLt, fontSize: 12, margin: 0 }}>Additional filters wired to the catalog index from Phase 2.</p>
      </aside>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: C.ink, margin: 0 }}>Browse Designs <span style={{ color: C.steel, fontSize: 15, fontWeight: 400 }}>({filtered.length})</span></h2>
        </div>
        <Grid>{filtered.map((p) => <Card key={p.id} p={p} />)}</Grid>
      </div>
    </div>
  );

  /* ------------------------------- PRODUCT ------------------------------ */
  const ProductView = () => {
    const p = selected;
    return (
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 20px" }}>
        <Back to="listing" label="Back to designs" />
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 28, marginTop: 14 }}>
          <div>
            <Thumb tone={p.tone} h={320} />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {[0,1,2].map((i) => <div key={i} style={{ flex: 1 }}><Thumb tone={p.tone} h={70} icon={Boxes} /></div>)}
            </div>
          </div>
          <div>
            <span style={{ background: C.mist, color: C.accent, fontSize: 12, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>{p.cat}</span>
            <h1 style={{ color: C.ink, fontSize: 28, margin: "12px 0 8px" }}>{p.title}</h1>
            <div style={{ display: "flex", gap: 14, color: C.steel, alignItems: "center" }}>
              <Stars r={p.rating} /><span>{p.reviews} reviews</span><span><MapPin size={13} style={{ verticalAlign: -1 }} /> {p.city}</span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, margin: "16px 0" }}>{inr(p.price)}</div>
            <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, fontSize: 14 }}>
              {[["Material",p.mat],["Finish",p.finish],["Dimensions",p.hw],["Installation",inr(p.install)],["Delivery",inr(p.delivery)]].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.mist}` }}>
                  <span style={{ color: C.steel }}>{k}</span><span style={{ color: C.ink, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <Btn kind="amber" onClick={() => { setSelected(p); go("checkout"); }}>Buy Now</Btn>
              <Btn kind="ghost" onClick={() => toggleWish(p)}><Heart size={16} /> Wishlist</Btn>
              <Btn kind="dark"><MessageCircle size={16} /> Contact Seller</Btn>
              <Btn kind="wa"><Phone size={16} /> WhatsApp</Btn>
            </div>
            <div style={{ marginTop: 18, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: 8, background: C.ink, display: "grid", placeItems: "center", color: "#fff" }}><Store size={20} /></div>
              <div>
                <div style={{ fontWeight: 700, color: C.ink, display: "flex", gap: 6, alignItems: "center" }}>{p.seller} <BadgeCheck size={15} color={C.ok} /></div>
                <div style={{ color: C.steel, fontSize: 13 }}>Verified fabricator • Serves {p.city}</div>
              </div>
            </div>
          </div>
        </div>
        <h2 style={{ color: C.ink, marginTop: 36 }}>Reviews</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {[["Anita S.","Excellent finish, installed on time.",5],["Vikram R.","Strong build. Measurement visit was prompt.",4]].map(([n,t,r]) => (
            <div key={n} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ color: C.ink }}>{n}</b><Stars r={r} /></div>
              <p style={{ color: C.steel, margin: "8px 0 0", fontSize: 14 }}>{t}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* --------------------------------- CART ------------------------------- */
  const Cart = () => (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "30px 20px" }}>
      <h1 style={{ color: C.ink }}>Your Cart</h1>
      {cart.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.steel }}>
          Cart is empty. <span onClick={() => go("listing")} style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }}>Browse designs</span>
        </div>
      ) : cart.map((p) => (
        <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, display: "flex", gap: 14, marginBottom: 12 }}>
          <div style={{ width: 90 }}><Thumb tone={p.tone} h={70} /></div>
          <div style={{ flex: 1 }}>
            <b style={{ color: C.ink }}>{p.title}</b>
            <div style={{ color: C.steel, fontSize: 13 }}>{p.cat} • {p.seller}</div>
            <div style={{ marginTop: 6, fontWeight: 700, color: C.ink }}>{inr(total(p))} <span style={{ fontWeight: 400, fontSize: 12, color: C.steel }}>incl. install + delivery</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" }}>
            <X size={18} color={C.steel} style={{ cursor: "pointer" }} onClick={() => setCart(cart.filter((c) => c.id !== p.id))} />
            <Btn kind="amber" onClick={() => { setSelected(p); go("checkout"); }} style={{ padding: "8px 14px" }}>Checkout</Btn>
          </div>
        </div>
      ))}
    </div>
  );

  /* ------------------------------- CHECKOUT ----------------------------- */
  const Checkout = () => {
    const p = selected || cart[0] || PRODUCTS[0];
    const [addr, setAddr] = useState("12 Rose Villa, Kothrud, Pune 411038");
    const t = total(p), adv = Math.round(t * 0.2);
    const Field = ({ label, ...r }) => (
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: C.steel, fontWeight: 600 }}>{label}</span>
        <input {...r} style={{ width: "100%", marginTop: 5, padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </label>
    );
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 20px" }}>
        <Back to="product" label="Back" />
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, marginTop: 14 }}>
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ color: C.ink, marginTop: 0 }}>Installation details</h2>
            <Field label="Installation address" value={addr} onChange={(e) => setAddr(e.target.value)} />
            <Field label="Preferred date" type="date" defaultValue="2026-06-15" />
            <Field label="Notes for seller" placeholder="Gate facing east; call before arrival" />
          </div>
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 20, height: "fit-content" }}>
            <h2 style={{ color: C.ink, marginTop: 0, fontSize: 18 }}>Cost summary</h2>
            {[["Product price", p.price],["Installation", p.install],["Delivery", p.delivery]].map(([k,v]) => (
              <Row key={k} k={k} v={inr(v)} />
            ))}
            <div style={{ borderTop: `1px solid ${C.line}`, margin: "10px 0", paddingTop: 10 }}><Row k="Total" v={inr(t)} bold /></div>
            <div style={{ background: C.mist, borderRadius: 10, padding: 14, marginTop: 8 }}>
              <Row k="Advance now (20%)" v={inr(adv)} bold accent />
              <Row k="Balance later" v={inr(t - adv)} />
            </div>
            <Btn kind="amber" onClick={() => placeOrder(p, addr)} style={{ width: "100%", justifyContent: "center", marginTop: 16, padding: "13px" }}>
              Pay {inr(adv)} via Razorpay
            </Btn>
            <p style={{ color: C.steelLt, fontSize: 12, textAlign: "center", marginBottom: 0 }}>Secure payment • 5% platform fee applies to seller</p>
          </div>
        </div>
      </div>
    );
  };
  const Row = ({ k, v, bold, accent }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
      <span style={{ color: accent ? C.accent : C.steel, fontWeight: bold ? 700 : 400 }}>{k}</span>
      <span style={{ color: accent ? C.accent : C.ink, fontWeight: bold ? 700 : 500 }}>{v}</span>
    </div>
  );

  /* ------------------------------- TRACKING ----------------------------- */
  const Tracking = () => {
    const o = order;
    const icons = [Package, Check, MapPin, Factory, Factory, Truck, ClipboardCheck, Hammer, BadgeCheck];
    return (
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ background: C.ink, color: "#fff", borderRadius: 14, padding: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "#9fb0d0", fontSize: 13 }}>Order {o.id}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{o.product.title}</div>
            <div style={{ color: "#9fb0d0", fontSize: 13, marginTop: 4 }}>{o.address}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#9fb0d0", fontSize: 13 }}>Total</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{inr(o.total)}</div>
            <div style={{ color: "#9fb0d0", fontSize: 12 }}>Advance paid {inr(o.advance)}</div>
          </div>
        </div>

        <h2 style={{ color: C.ink, marginTop: 28 }}>Live tracking</h2>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
          {STATUSES.map((s, i) => {
            const done = i <= o.stage, current = i === o.stage; const Icon = icons[i];
            return (
              <div key={s} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 20, display: "grid", placeItems: "center",
                    background: done ? (current ? C.amber : C.ok) : C.mist, color: done ? "#fff" : C.steelLt }}>
                    <Icon size={17} />
                  </div>
                  {i < STATUSES.length - 1 && <div style={{ width: 2, height: 26, background: i < o.stage ? C.ok : C.line }} />}
                </div>
                <div style={{ paddingTop: 6 }}>
                  <div style={{ fontWeight: current ? 700 : 500, color: done ? C.ink : C.steelLt }}>{s}</div>
                  {current && <div style={{ color: C.amber, fontSize: 12, fontWeight: 600 }}>In progress</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Btn kind="ghost" onClick={() => go("buyerDash")}>Go to my orders</Btn>
          {o.stage < STATUSES.length - 1 && <Btn onClick={() => setOrder({ ...o, stage: o.stage + 1 })}>Advance status (demo)</Btn>}
        </div>
      </div>
    );
  };

  /* ------------------------------ REGISTER ------------------------------ */
  const Register = ({ kind }) => {
    const seller = kind === "seller";
    const fields = seller
      ? ["Shop Name","Owner Name","Address","City","State","PIN Code","Email","Mobile","WhatsApp","GST Number","PAN Number","Password"]
      : ["Full Name","Address","City","State","PIN Code","Email","Mobile","Password"];
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <Btn kind={seller ? "ghost" : "primary"} onClick={() => go("registerBuyer")}>Buyer</Btn>
          <Btn kind={seller ? "primary" : "ghost"} onClick={() => go("registerSeller")}>Seller</Btn>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 26 }}>
          <h1 style={{ color: C.ink, marginTop: 0 }}>{seller ? "Seller Registration" : "Buyer Registration"}</h1>
          <p style={{ color: C.steel, marginTop: -8 }}>{seller ? "Your GST, PAN & shop license are verified before products go live." : "Create an account to order and track installations."}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map((f) => (
              <label key={f} style={{ gridColumn: ["Address","Shop Name","Full Name"].includes(f) ? "span 2" : "auto" }}>
                <span style={{ fontSize: 12, color: C.steel, fontWeight: 600 }}>{f}</span>
                <input type={f === "Password" ? "password" : "text"} placeholder={f}
                  style={{ width: "100%", marginTop: 4, padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </label>
            ))}
          </div>
          {seller && (
            <div style={{ marginTop: 14, background: C.mist, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Document upload</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["GST Certificate","PAN Card","Shop License"].map((d) => (
                  <div key={d} style={{ flex: 1, minWidth: 140, border: `1px dashed ${C.steelLt}`, borderRadius: 8, padding: "14px", textAlign: "center", color: C.steel, fontSize: 13 }}>
                    <Plus size={16} /><div>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Btn kind="amber" onClick={() => go(seller ? "sellerDash" : "buyerDash")} style={{ width: "100%", justifyContent: "center", marginTop: 18, padding: 13 }}>
            Create {seller ? "Seller" : "Buyer"} Account
          </Btn>
        </div>
      </div>
    );
  };

  /* ------------------------------ DASHBOARDS ---------------------------- */
  const Shell = ({ title, menu, children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", minHeight: "70vh" }}>
      <aside style={{ background: C.ink, color: "#fff", padding: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 18 }}>{title}</div>
        {menu.map((m) => (
          <div key={m} style={{ padding: "10px 12px", borderRadius: 8, color: "#cfd6e2", fontSize: 14, cursor: "pointer", marginBottom: 2 }}
            onMouseDown={(e) => (e.currentTarget.style.background = C.ink2)}>{m}</div>
        ))}
      </aside>
      <main style={{ padding: 24, background: C.mist }}>{children}</main>
    </div>
  );

  const SellerDash = () => (
    <Shell title="Seller Panel" menu={["Dashboard","Add Design","Manage Designs","Orders","Earnings","Reviews","Inquiries","Settings","Logout"]}>
      <h1 style={{ color: C.ink, marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Metric label="Total Products" value="12" icon={Package} />
        <Metric label="Total Orders" value="48" icon={Boxes} />
        <Metric label="Pending Orders" value="5" icon={ClipboardCheck} accent={C.amber} />
        <Metric label="Completed" value="40" icon={Check} accent={C.ok} />
        <Metric label="Revenue" value={inr(2235000)} icon={Wallet} />
      </div>
      <h2 style={{ color: C.ink }}>Recent Orders</h2>
      <Table head={["Order","Product","Buyer","Total","Payout (−5%)","Status"]}
        rows={[["GC…123","SS Main Gate","Anita S.",inr(55000),inr(52250),"Manufacturing"],
               ["GC…122","Sliding Gate","Vikram R.",inr(80500),inr(76475),"Installation"],
               ["GC…120","Balcony Grill","Meena T.",inr(16300),inr(15485),"Closed"]]} />
    </Shell>
  );

  const BuyerDash = () => (
    <Shell title="Buyer Panel" menu={["Browse Products","Search","Wishlist","Order History","Settings","Logout"]}>
      <h1 style={{ color: C.ink, marginTop: 0 }}>My Orders</h1>
      <Table head={["Order","Product","Total","Advance","Status"]}
        rows={[[order?.id || "GC…123", order?.product.title || "SS Main Gate", inr(order?.total || 55000), inr(order?.advance || 11000), STATUSES[order?.stage ?? 3]]]} />
      <div style={{ marginTop: 10 }}><Btn onClick={() => order && go("tracking")} kind="ghost">Track latest order</Btn></div>
      <h2 style={{ color: C.ink }}>Wishlist ({wishlist.length})</h2>
      {wishlist.length === 0 ? <p style={{ color: C.steel }}>No saved designs yet.</p> :
        <Grid>{wishlist.map((p) => <Card key={p.id} p={p} />)}</Grid>}
    </Shell>
  );

  const AdminDash = () => {
    const [sellers, setSellers] = useState([
      { n: "SteelCrafts Fabricators", c: "Pune", s: "approved" },
      { n: "IronArt Works", c: "Mumbai", s: "pending" },
      { n: "Vidarbha Fab", c: "Nagpur", s: "pending" },
    ]);
    const set = (i, s) => setSellers(sellers.map((x, j) => (j === i ? { ...x, s } : x)));
    return (
      <Shell title="Admin Panel" menu={["Dashboard","Verify Sellers","Products","Orders","Payments","Reviews","Complaints","Users"]}>
        <h1 style={{ color: C.ink, marginTop: 0 }}>Marketplace Overview</h1>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Metric label="Total Buyers" value="8,420" icon={Users} />
          <Metric label="Total Sellers" value="1,204" icon={Store} />
          <Metric label="Total Products" value="18,930" icon={Package} />
          <Metric label="Total Orders" value="6,512" icon={Boxes} />
          <Metric label="Total Revenue" value={inr(48200000)} icon={Wallet} />
          <Metric label="Commission (5%)" value={inr(2410000)} icon={ShieldCheck} accent={C.amber} />
        </div>
        <h2 style={{ color: C.ink }}>Seller Verification</h2>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
          {sellers.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottom: `1px solid ${C.mist}` }}>
              <div><b style={{ color: C.ink }}>{s.n}</b><div style={{ color: C.steel, fontSize: 13 }}>{s.c} • GST & PAN submitted</div></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                  background: s.s === "approved" ? "#E3F3EC" : s.s === "rejected" ? "#FBE7E7" : "#FBF1DD",
                  color: s.s === "approved" ? C.ok : s.s === "rejected" ? "#B23B3B" : C.amber }}>{s.s}</span>
                {s.s === "pending" && <>
                  <Btn onClick={() => set(i, "approved")} style={{ padding: "6px 12px" }}>Approve</Btn>
                  <Btn kind="ghost" onClick={() => set(i, "rejected")} style={{ padding: "6px 12px" }}>Reject</Btn>
                </>}
              </div>
            </div>
          ))}
        </div>
      </Shell>
    );
  };

  const Table = ({ head, rows }) => (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${head.length},1fr)`, padding: "12px 14px", background: C.mist, fontSize: 12, fontWeight: 700, color: C.steel }}>
        {head.map((h) => <span key={h}>{h}</span>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${head.length},1fr)`, padding: "13px 14px", fontSize: 14, color: C.ink, borderTop: `1px solid ${C.mist}` }}>
          {r.map((c, j) => <span key={j}>{c}</span>)}
        </div>
      ))}
    </div>
  );

  const Back = ({ to, label }) => (
    <span onClick={() => go(to)} style={{ color: C.accent, cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14 }}>
      <ArrowLeft size={16} /> {label}
    </span>
  );
  const Footer = () => (
    <div style={{ background: C.ink, color: "#9fb0d0", padding: "30px 20px" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ color: "#fff", fontWeight: 700 }}>GateConnect India</div>
        <div style={{ fontSize: 13 }}>Browse • Sell • Track • © 2026 — Prototype</div>
      </div>
    </div>
  );

  const views = {
    home: <HomeView />, listing: <Listing />, product: selected ? <ProductView /> : <Listing />,
    cart: <Cart />, checkout: <Checkout />, tracking: order ? <Tracking /> : <HomeView />,
    registerBuyer: <Register kind="buyer" />, registerSeller: <Register kind="seller" />,
    sellerDash: <SellerDash />, buyerDash: <BuyerDash />, adminDash: <AdminDash />,
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: C.ink, ...font }}>
      <Nav />
      {views[view]}
    </div>
  );
}
