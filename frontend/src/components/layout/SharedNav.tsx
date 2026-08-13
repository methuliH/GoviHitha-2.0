import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/home.module.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/diagnose", label: "Diagnose" },
  { href: "/advisor", label: "Plan Planting" },
  { href: "/market", label: "Market Prices" },
  { href: "/about", label: "About" },
];

export default function SharedNav() {
  const { pathname } = useRouter();
  return (
    <nav
      className={styles.navBar}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(37,62,32,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(144,169,85,0.2)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" overflow="visible">
          <path d="M15 3 C15 3, 6 8, 6 17 C6 23 10 26 15 26 C20 26 24 23 24 17 C24 8 15 3 15 3Z" fill="#ECF39E" opacity="0.92" />
          <line x1="15" y1="26" x2="15" y2="10" stroke="#31572C" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15 17 Q11 15 9 12" stroke="#31572C" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <path d="M15 20 Q19 18 21 15" stroke="#31572C" strokeWidth="1.1" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span style={{ font: "700 20px 'Outfit'", color: "#ECF39E", letterSpacing: "-0.03em" }}>GoviHitha</span>
          <span className={styles.navSubtitle} style={{ font: "600 11px 'Outfit'", color: "#90A955", letterSpacing: "0.12em" }}>CROP ADVISORY</span>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={pathname === href ? styles.navLinkActive : styles.navLink}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
