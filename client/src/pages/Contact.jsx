import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Contact() {
  return (
    <PageContainer>
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            Contact GD Realty
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-100">
            Talk to an agent today
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Have questions about a listing or want help finding the right neighborhood?
            Send a message and our team will respond within one business day.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input label="First name" placeholder="Alex" />
            <Input label="Last name" placeholder="Johnson" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Email" placeholder="alex@email.com" type="email" />
            <Input label="Phone" placeholder="(555) 555-5555" />
          </div>
          <div className="mt-4">
            <Input
              label="Message"
              as="textarea"
              rows={4}
              placeholder="Tell us what you're looking for..."
            />
          </div>
          <Button className="mt-5 w-fit">Send message</Button>
        </Card>

        <Card className="p-8">
          <h2 className="text-lg font-semibold text-slate-100">Office hours</h2>
          <p className="mt-2 text-sm text-slate-300">
            Monday - Friday: 9:00 AM - 6:00 PM
          </p>
          <p className="text-sm text-slate-300">Saturday: 10:00 AM - 4:00 PM</p>
          <p className="text-sm text-slate-300">Sunday: Closed</p>

          <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-slate-100">Main office</p>
            <p className="mt-2 text-sm text-slate-300">
              1100 Market Street, Suite 200
            </p>
            <p className="text-sm text-slate-300">San Francisco, CA 94103</p>
            <p className="mt-2 text-sm text-slate-300">(415) 555-0199</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
