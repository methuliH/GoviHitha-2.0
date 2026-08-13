import Link from "next/link";
import { useRouter } from "next/router";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/diagnose", label: "Diagnose" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const { pathname } = useRouter();

  return (
    <header className="bg-white border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-green-800 text-lg tracking-tight group-hover:text-green-600 transition-colors">
            GoviHitha
          </span>
          <span className="hidden sm:inline text-xs text-green-500 font-medium mt-0.5">
            AI Crop Advisory
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:text-green-700 hover:bg-green-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
