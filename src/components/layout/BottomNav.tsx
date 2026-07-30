import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Stock', icon: '🧵', end: true },
  { to: '/catalogue', label: 'Catalogue', icon: '🎨' },
  { to: '/projets', label: 'Projets', icon: '📿' },
  { to: '/reglages', label: 'Réglages', icon: '⚙️' },
]

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <ul className="mx-auto flex max-w-lg justify-around">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-500'
                }`
              }
            >
              <span className="text-xl leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
