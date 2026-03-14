import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-8 flex items-center gap-6 h-14">
        <span className="font-bold text-gray-800 text-sm">Excel 差分比較ツール</span>
        <nav className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:text-gray-900"
              }`
            }
          >
            新規比較
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:text-gray-900"
              }`
            }
          >
            履歴
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
