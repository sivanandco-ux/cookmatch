import ContactForm from './ContactForm'

export default function ContactPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
        <p className="text-sm text-gray-500 mt-1">Questions, feedback, or anything else — send us a message and we'll get back to you.</p>
      </div>

      <div className="bg-panel rounded-sm border-l-4 border-copper-600 p-6">
        <ContactForm />
      </div>
    </div>
  )
}
