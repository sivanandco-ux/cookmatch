export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h1>
      <p className="text-gray-600 mb-2">
        Sivan Cooks is a planning tool for people deciding whether to turn their cooking into a side income. It's not
        a marketplace or a directory — we don't connect you with clients, list cooks for hire, or process payments.
        The goal is a single, honest answer: is this worth it for you, given your income goal, the legal path that
        fits, and the real costs involved?
      </p>
      <p className="text-gray-600 mb-10">
        See our{' '}
        <a href="/terms" className="text-copper-600 underline hover:text-copper-700">Terms of Service</a>.
      </p>

      <div className="flex flex-col gap-10">

        {/* What the planner does */}
        <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">The Planning Tool</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">What we do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Ask what you want to earn, and work backward to what you'd need to sell</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Show the legal path that fits how you'd cook and sell — traveling to a client's kitchen, cooking at home, or selling shelf-stable items — and what each actually requires</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Break down price, ingredient and packaging cost, and profit per unit — clearly separated from revenue</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Show real permit and registration fees where we have them verified (California), and point you to the right agency elsewhere</li>
                <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Give you a break-even estimate and a plain verdict on whether your goal fits the path you picked</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">What we don't do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not connect you with clients, list cooks, or run a directory</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not process payments or take a cut of anything</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not give a final legal determination — confirm requirements with your local health department or state agency before acting</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">✕</span>We do not provide personalized legal or tax advice — for that, talk to a professional</li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <a href="/plan" className="inline-block bg-copper-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700">
              Plan My Gig →
            </a>
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
