import { Route, Routes, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Listings from './pages/Listings'
import ListingDetails from './pages/ListingDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import UpdateProfile from './pages/UpdateProfile'
import AddPost from './pages/AddPost'
import About from './pages/About'
import Contact from './pages/Contact'
import { useAuth } from './context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
  if (loading) {
    return (
      <div className="container-pad py-16 text-center text-sm text-slate-300">
        Checking session...
      </div>
    )
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { currentUser, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Navbar currentUser={currentUser} onLogout={logout} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/list" element={<Listings />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/update"
            element={
              <ProtectedRoute>
                <UpdateProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddPost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <AddPost />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
