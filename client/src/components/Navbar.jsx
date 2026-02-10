import { Link, NavLink } from 'react-router-dom'
import Button from './Button'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Agents', to: '/agents' },
]

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="container-pad flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-100">
          <span className="rounded-xl bg-indigo-600 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
            GD
          </span>
          <span>Realty</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `transition hover:text-slate-100 ${isActive ? 'text-slate-100' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!currentUser ? (
            <>
              <Button as={Link} to="/login" variant="ghost" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button as={Link} to="/register" variant="primary">
                Sign up
              </Button>
            </>
          ) : (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-sm font-semibold">
                <span className="hidden text-slate-200 sm:inline">Hi, {currentUser.username}</span>
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                />
              </Link>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
