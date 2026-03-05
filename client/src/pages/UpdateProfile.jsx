import { useState, useEffect } from 'react'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext.jsx'
import { parseJson } from '../utils/api.js'

export default function UpdateProfile() {
  const { currentUser, refreshMe } = useAuth()
  const [preferredBudget, setPreferredBudget] = useState('')
  const [riskTolerance, setRiskTolerance] = useState('')
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsMessage, setPrefsMessage] = useState(null)

  useEffect(() => {
    if (currentUser) {
      setPreferredBudget(
        currentUser.preferredBudget != null && currentUser.preferredBudget > 0
          ? String(currentUser.preferredBudget)
          : ''
      )
      setRiskTolerance(currentUser.riskTolerance || '')
    }
  }, [currentUser])

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setPrefsMessage(null)
    setPrefsSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          preferredBudget: preferredBudget === '' ? null : Number(preferredBudget),
          riskTolerance: riskTolerance || '',
        }),
      })
      const data = await parseJson(res)
      if (!res.ok) {
        setPrefsMessage(data?.message || 'Failed to save.')
        return
      }
      await refreshMe()
      setPrefsMessage('Preferences saved.')
    } catch {
      setPrefsMessage('Failed to save preferences.')
    } finally {
      setPrefsSaving(false)
    }
  }

  return (
    <PageContainer className="pb-16">
      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-slate-100">Update Profile</h1>
          <p className="mt-2 text-sm text-slate-300">
            Keep your profile up to date so agents can reach you.
          </p>
          <form className="mt-6 flex flex-col gap-4">
            <Input label="Username" placeholder="john2" />
            <Input label="Email" placeholder="john@gmail.com" type="email" />
            <Input label="Password" placeholder="••••••••" type="password" />
            <Button type="submit" className="w-fit">
              Update
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-100">AI & search preferences</h2>
          <p className="mt-1 text-sm text-slate-400">
            Set a budget and risk tolerance to personalize recommendations and AI insights.
          </p>
          <form onSubmit={handleSavePreferences} className="mt-4 flex flex-col gap-4">
            <Input
              label="Preferred budget ($)"
              type="number"
              min="0"
              step="1000"
              placeholder="e.g. 500000"
              value={preferredBudget}
              onChange={(e) => setPreferredBudget(e.target.value)}
              helper="Leave blank for no limit"
            />
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
              Risk tolerance
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              >
                <option value="">Not set</option>
                <option value="low">Low — prefer safer, fair-value listings</option>
                <option value="medium">Medium — balanced</option>
                <option value="high">High — open to higher-risk opportunities</option>
              </select>
            </label>
            {prefsMessage && (
              <p className={`text-sm ${prefsMessage.startsWith('Preferences saved') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {prefsMessage}
              </p>
            )}
            <Button type="submit" className="w-fit" disabled={prefsSaving}>
              {prefsSaving ? 'Saving…' : 'Save preferences'}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col items-center gap-4 p-6 text-center lg:col-span-2">
          <p className="text-sm font-semibold text-slate-100">Change the avatar</p>
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=60'}
            alt="Current avatar"
            className="h-40 w-40 rounded-3xl object-cover"
          />
          <Button variant="outline">Upload</Button>
        </Card>
      </div>
    </PageContainer>
  )
}
