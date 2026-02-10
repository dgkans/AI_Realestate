import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import Button from '../components/Button'
import Input from '../components/Input'
import PageContainer from '../components/PageContainer'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      await login({ email: formValues.email, password: formValues.password })
      setSuccess('Login successful. Redirecting...')
      setTimeout(() => navigate('/profile'), 600)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer className="flex items-center justify-center">
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to manage your listings and messages."
        footer={
          <>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-300">
              Sign up
            </Link>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            placeholder="you@email.com"
            type="email"
            value={formValues.email}
            onChange={(event) =>
              setFormValues({ ...formValues, email: event.target.value })
            }
          />
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            value={formValues.password}
            onChange={(event) =>
              setFormValues({ ...formValues, password: event.target.value })
            }
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          {success && <p className="text-xs text-emerald-300">{success}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </AuthForm>
    </PageContainer>
  )
}
