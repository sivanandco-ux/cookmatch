const WHAT_WE_DO = [
  {
    title: 'Set an income goal',
    body: "Tell us what you'd like to earn — per week, month, or year — and we work backward from there instead of guessing at numbers that don't fit your life.",
    icon: '🎯',
    accent: 'border-copper-600',
    iconBg: 'bg-copper-600',
  },
  {
    title: 'See the real legal paths',
    body: "Traveling to cook in a client's kitchen, cooking hot meals at home, or selling shelf-stable items each have different rules, permits, and costs — sourced from official state and county fee schedules, not guesswork.",
    icon: '📋',
    accent: 'border-leaf-500',
    iconBg: 'bg-leaf-700',
  },
  {
    title: 'Do the math before you invest',
    body: "Price, ingredients, packaging, permit fees, and how long it takes to break even — all worked out before you spend a dollar on a certification.",
    icon: '🧮',
    accent: 'border-brass',
    iconBg: 'bg-brass',
  },
]

const WHAT_WE_DONT_DO = [
  "We don't connect you with clients or list cooks for hire — this isn't a marketplace or a directory.",
  "We don't process payments or take a cut of anything you earn.",
  "We don't provide legal or tax advice — we point you to the right agency and professional for your specific situation.",
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-leaf-700 to-leaf-800 text-paper py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brass-light mb-3">
            A Planning Tool for Home Cooks
          </div>
          <h1 className="text-2xl sm:text-3xl leading-tight mb-4 text-paper">
            Thinking about turning your cooking
            <br />
            <span className="text-brass-light">into a side income?</span>
          </h1>
          <p className="text-sm sm:text-base text-paper/80 max-w-lg mx-auto mb-6">
            Sivan Cooks helps you decide whether it's actually worth it — walk through your income goal, the legal
            path that fits how you'd cook and sell, and the real costs, before you spend anything on a permit or
            certification.
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <a href="/plan" className="text-sm bg-copper-600 hover:bg-copper-700 text-white font-semibold px-5 py-2.5 rounded-lg">
              Plan My Gig →
            </a>
            <a
              href="/become-a-cook"
              className="text-sm border border-paper/35 hover:border-brass-light hover:text-brass-light text-paper font-semibold px-5 py-2.5 rounded-lg"
            >
              See the Legal Paths
            </a>
          </div>
        </div>
      </header>

      {/* What We Do */}
      <section className="bg-panel py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-copper-600 mb-2">What Sivan Cooks Does</div>
            <h2 className="text-xl sm:text-2xl text-leaf-800 mb-2.5">A cursory, honest planning check</h2>
            <p className="text-sm text-gray-600">
              No signup required. Answer a few questions, see real numbers, and decide for yourself before you commit to anything.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WHAT_WE_DO.map((item) => (
              <div key={item.title} className={`bg-white rounded-xl p-6 border-l-4 ${item.accent}`}>
                <div className={`w-9 h-9 rounded-lg ${item.iconBg} text-white flex items-center justify-center font-display text-base mb-3`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-leaf-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-4 flex-wrap">
            <a href="/plan" className="text-sm bg-copper-600 hover:bg-copper-700 text-white font-semibold px-5 py-2.5 rounded-lg">
              Plan My Gig →
            </a>
          </div>
        </div>
      </section>

      {/* What We Don't Do */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-lg sm:text-xl text-leaf-800 text-center mb-7">What Sivan Cooks Doesn&apos;t Do</h2>
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          {WHAT_WE_DONT_DO.map((item) => (
            <div key={item} className="flex gap-3 bg-white rounded-lg p-4 border border-gray-200 text-sm text-gray-700">
              <span className="text-gray-400 shrink-0">✕</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Who We Are */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div>
            <div className="font-display text-5xl leading-none text-brass mb-1">&ldquo;</div>
            <p className="font-display text-lg text-leaf-800 leading-snug mb-4">
              Before anyone spends money on a permit, they deserve an honest answer to "is this actually worth it?"
            </p>
            <div className="bg-panel border-l-[3px] border-copper-600 rounded p-5 text-sm leading-relaxed text-gray-600">
              <p className="mb-3">
                Growing up in Chennai, India, I was surrounded by home-based businesses — electrical work, packaging,
                spare parts, the small operations that quietly kept everything running. Some of my earliest memories
                aren&apos;t of playgrounds — they&apos;re of listening to my parents and their colleagues debate
                startup ideas around the dinner table in the 1980s. Everyone I knew started small and built something
                real.
              </p>
              <p className="mb-3">
                Food wasn&apos;t part of that world — but the principles are the same, and the struggles are just as
                familiar: cash flow, finding customers, earning trust before anyone takes a chance on you. The more I
                looked into what it actually takes to sell home-cooked food legally in the U.S. — permits, revenue
                caps, food safety rules that vary by state and county — the clearer it became that most people
                considering this don&apos;t have an easy way to find honest, specific answers before they spend money.
              </p>
              <p className="font-semibold text-leaf-800 mt-3">— Tara Jagannathan, Founder, Sivan Cooks</p>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-copper-600 mb-3">Who We Are</div>
            <p className="text-sm text-gray-600 mb-3">
              <strong className="text-leaf-800 font-semibold">Sivan Cooks</strong>{' '}
              is a planning tool for people weighing whether to turn their cooking into a side income — not a
              marketplace, and not a directory of cooks for hire.
            </p>
            <p className="text-sm text-gray-600 mb-3">
              A lot of home cooks already know they're good enough that people would pay them — the harder question
              is whether the legal path, the real costs, and the numbers actually work out for their situation.
            </p>
            <p className="text-sm text-gray-600">
              Sivan Cooks walks you through that decision: your income goal, what you'd make and how you'd sell it,
              the certification or permit that applies to your state, and what it would cost to get started — all
              before you spend anything.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-16 px-6">
        <h2 className="text-xl sm:text-2xl text-leaf-800 mb-3 max-w-2xl mx-auto">
          Figure out if it's worth it before you spend a dollar on a permit.
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
          Takes a few minutes. No signup, no account, nothing to lose by checking.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <a href="/plan" className="text-sm bg-copper-600 hover:bg-copper-700 text-white font-semibold px-5 py-2.5 rounded-lg">
            Plan My Gig →
          </a>
        </div>
      </section>
    </>
  )
}
