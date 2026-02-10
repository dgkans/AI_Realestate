import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

export default function UpdateProfile() {
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
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-sm font-semibold text-slate-100">Change the avatar</p>
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=60"
            alt="Current avatar"
            className="h-40 w-40 rounded-3xl object-cover"
          />
          <Button variant="outline">Upload</Button>
        </Card>
      </div>
    </PageContainer>
  )
}
