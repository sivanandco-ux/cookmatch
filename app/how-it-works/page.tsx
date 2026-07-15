export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h1>
      <p className="text-gray-600 mb-10">
        Sivan Spices Home Cooks connects you with cooks across the USA who deliver healthy home-cooked food or come cook it in your kitchen. We started in the Bay Area and are growing to new cities as cooks and clients join us.
      </p>

      <div className="flex flex-col gap-10">

        {/* For Clients */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">For Clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">What we do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Show you approved cooks in your area who can deliver a meal or come cook at your home</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Let you see their cuisine specialties, ratings, and availability before booking</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Connect you directly with the cook — you get their phone, email, and WhatsApp</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Send you a feedback link after your session to rate your experience</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">What we don't do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not handle payment — you pay the cook directly</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not mediate disputes between clients and cooks</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not guarantee availability — confirm directly with the cook after booking</li>
              </ul>
            </div>
          </div>
        </section>

        {/* For Cooks */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">For Cooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">What we do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>List your profile, specialties, and availability so clients can find you</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Review your application and activate your profile manually</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Send you weekly availability reminders so your profile stays active</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Monitor your ratings and provide coaching if feedback drops</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">What we don't do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not take a commission from your earnings</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not assign bookings — clients contact you directly</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not handle scheduling conflicts — manage those directly with clients</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="bg-copper-50 border border-copper-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-copper-900 mb-2">This is a new service and we want to hear from you</h2>
          <p className="text-sm text-copper-800">
            We are actively improving based on your experience. If you have feedback, suggestions, or questions, please write to us at{' '}
            <a href="mailto:contact@sivanspices.com" className="font-medium underline hover:text-copper-600">
              contact@sivanspices.com
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  )
}
