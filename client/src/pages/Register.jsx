import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import Button from '../components/Button'
import Input from '../components/Input'
import PageContainer from '../components/PageContainer'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formValues, setFormValues] = useState({
    username: '',
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
      await register({
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
      })
      setSuccess('Account created. Redirecting...')
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
        title="Create your account"
        subtitle="Join GD Realty to save listings and message agents."
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-300">
              Sign in
            </Link>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Username"
            placeholder="yourname"
            value={formValues.username}
            onChange={(event) =>
              setFormValues({ ...formValues, username: event.target.value })
            }
          />
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
            {isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </form>
      </AuthForm>
    </PageContainer>
  )
}
