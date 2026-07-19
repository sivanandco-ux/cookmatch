const OFFERS = [
  {
    title: 'Home-Cooked Sessions',
    body: "Cook a full meal in a client's kitchen, or prepare it in your own and deliver — family dinners, festival spreads, small gatherings. You set your rate, your availability, and the terms.",
    icon: '☺',
    accent: 'border-copper-600',
    iconBg: 'bg-copper-600',
  },
  {
    title: 'Made-to-Order Items',
    body: "Pickles, laddus, baked goods, sauces — the specialty you're already known for among friends and family. List it once, take orders whenever you're ready to make a batch.",
    icon: '✿',
    accent: 'border-leaf-500',
    iconBg: 'bg-leaf-700',
  },
]

const HOW_IT_WORKS = [
  ['Sign up by talking', 'A guided conversation — type, voice-memo, or just talk — builds your profile in minutes.'],
  ['Get discovered', "Clients browse cooks by specialty, or post what they're craving and get matched to you."],
  ['Chat directly', 'Message the client to work out details before anything is confirmed — no surprises either way.'],
  ['Cook, deliver, grow', "Build a track record, earn trust, and get surfaced as one of the platform's star cooks."],
]

const TRAITS = [
  ['You make something real', "A full meal, a festival sweet, a pickle recipe passed down for generations — anything you'd be proud to put your name on."],
  ['You want it on your terms', "Set your own rate, your own hours, and only take on what you actually want to make. This is flexible income, not a shift you're assigned."],
  ["You're just getting started", "Never sold your cooking before? That's exactly who this is for — the guided signup and growth tools do the hard part with you, not for a fee."],
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-leaf-700 to-leaf-800 text-paper py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brass-light mb-3">
              Home Cooking Marketplace
            </div>
            <h1 className="text-2xl sm:text-3xl leading-tight mb-4 text-paper">
              Every neighborhood has
              <br />
              <span className="text-brass-light">a few incredible cooks.</span>
              <br />
              We help you find them.
            </h1>
            <p className="text-sm sm:text-base text-paper/80 max-w-md mb-6">
              Sivan Cooks connects local families with home cooks making authentic meals, pickles, sweets, snacks, and
              baked goods — the kind of food that usually only travels as far as a phone number passed between
              neighbors.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a href="#onboard" className="text-sm bg-copper-600 hover:bg-copper-700 text-white font-semibold px-5 py-2.5 rounded-lg">
                Apply as a Cook →
              </a>
              <a
                href="#what-we-do"
                className="text-sm border border-paper/35 hover:border-brass-light hover:text-brass-light text-paper font-semibold px-5 py-2.5 rounded-lg"
              >
                See How It Works
              </a>
            </div>
            <div className="flex gap-6 mt-7 flex-wrap">
              <div>
                <div className="font-display text-lg text-brass-light">2</div>
                <div className="text-xs text-paper/65">
                  Ways to offer
                  <br />
                  your cooking
                </div>
              </div>
              <div>
                <div className="font-display text-lg text-brass-light">$0</div>
                <div className="text-xs text-paper/65">
                  Commission on
                  <br />
                  what you earn
                </div>
              </div>
              <div>
                <div className="font-display text-lg text-brass-light">Concierge</div>
                <div className="text-xs text-paper/65">
                  Guided signup —
                  <br />
                  talk, don&apos;t type
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-sm mx-auto md:max-w-none md:mx-0 rounded-2xl overflow-hidden aspect-[4/5] bg-leaf-800">
            <div className="hero-slideshow">
              <img className="hero-slide" src="/landing-dishes/pistachio-baklava.jpg" alt="Pistachio baklava made by a cook on Sivan Cooks" />
              <img className="hero-slide" src="/landing-dishes/rasam.jpg" alt="Homemade rasam made by a cook on Sivan Cooks" />
              <img className="hero-slide" src="/landing-dishes/curry-leaf-rice.jpg" alt="Curry leaf rice made by a cook on Sivan Cooks" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-leaf-900/75 to-transparent pointer-events-none" />
            <div className="absolute left-4 bottom-4 z-10 text-paper text-xs font-semibold">
              Real dishes from cooks in the directory
            </div>
          </div>
        </div>
      </header>

      {/* Who We Are */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div>
            <div className="font-display text-5xl leading-none text-brass mb-1">&ldquo;</div>
            <p className="font-display text-lg text-leaf-800 leading-snug mb-4">
              Food made by someone who actually cares what you think of it — that&apos;s the whole idea.
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
                familiar: cash flow, finding customers, earning trust before anyone takes a chance on you. That&apos;s
                exactly what makes food interesting to me now. I believe it&apos;s a space overdue for real
                innovation, and I want to be part of bringing it.
              </p>
              <p>
                My own journey started in between tech roles, when I launched{' '}
                <strong className="text-copper-700">Sivan Spices</strong> to share the authentic, pure, and healthy
                recipes I grew up on. Sivan Cooks is the next step — the same entrepreneurial instinct, now applied to
                an entirely new space.
              </p>
              <p className="font-semibold text-leaf-800 mt-3">— Founder, Sivan Spices &amp; Sivan Cooks</p>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-copper-600 mb-3">Who We Are</div>
            <p className="text-sm text-gray-600 mb-3">
              <strong className="text-leaf-800 font-semibold">Sivan Cooks</strong> is a directory and matchmaking
              platform for local culinary artisans — home cooks who make real food, the way it&apos;s made at home,
              not in a commercial kitchen chasing volume.
            </p>
            <p className="text-sm text-gray-600 mb-3">
              We built it because the best cooking in any neighborhood usually never leaves that neighborhood. A
              friend&apos;s mother who makes the only mango pickle you&apos;ll ever want. A neighbor who bakes laddus
              for every festival and would happily make a batch for you too, if only you knew to ask.
            </p>
            <p className="text-sm text-gray-600">
              Sivan Cooks is how you ask. Clients browse or post what they&apos;re craving; cooks get matched, chat
              directly, and agree on the rest themselves — no middleman marking up the price, no corporate kitchen
              between you and the person who actually cooked your food.
            </p>
          </div>
        </div>
      </section>

      {/* What We're Doing */}
      <section id="what-we-do" className="bg-panel py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-copper-600 mb-2">What We&apos;re Doing</div>
            <h2 className="text-xl sm:text-2xl text-leaf-800 mb-2.5">Two ways to share what you cook</h2>
            <p className="text-sm text-gray-600">
              Every cook on Sivan Cooks offers one or both of these — whichever fits how they actually like to cook.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {OFFERS.map((offer) => (
              <div key={offer.title} className={`bg-white rounded-xl p-6 border-l-4 ${offer.accent}`}>
                <div className={`w-9 h-9 rounded-lg ${offer.iconBg} text-white flex items-center justify-center font-display text-base mb-3`}>
                  {offer.icon}
                </div>
                <h3 className="text-base font-semibold text-leaf-800 mb-2">{offer.title}</h3>
                <p className="text-gray-600 text-sm">{offer.body}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
            {HOW_IT_WORKS.map(([title, body], i) => (
              <div key={title}>
                <div className="w-7 h-7 rounded-full border border-copper-300 text-copper-600 font-display text-xs flex items-center justify-center mb-2.5">
                  {i + 1}
                </div>
                <h4 className="font-semibold text-sm text-leaf-800 mb-1">{title}</h4>
                <p className="text-xs text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Want to Onboard */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div id="onboard" className="relative overflow-hidden bg-leaf-700 text-paper rounded-2xl p-6 sm:p-10">
          <div className="max-w-xl mb-7 relative">
            <div className="text-xs font-semibold uppercase tracking-widest text-brass-light mb-2">Who We Want to Onboard</div>
            <h2 className="text-xl sm:text-2xl text-paper mb-2.5">
              If people already ask you to cook for them, you belong here.
            </h2>
            <p className="text-sm text-paper/80">
              We&apos;re not looking for restaurant experience or a commercial kitchen. We&apos;re looking for the
              cook everyone already knows about.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {TRAITS.map(([title, body]) => (
              <div key={title} className="border-t border-brass-light/30 pt-3">
                <h4 className="font-display text-base text-brass-light mb-1.5">{title}</h4>
                <p className="text-xs text-paper/75">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-4 flex-wrap relative">
            <a href="/apply" className="text-sm bg-copper-600 hover:bg-copper-700 text-white font-semibold px-5 py-2.5 rounded-lg">
              Apply to Become a Cook →
            </a>
            <p className="text-xs text-paper/65">Takes about 10 minutes. No cooking résumé required.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-16 px-6">
        <h2 className="text-xl sm:text-2xl text-leaf-800 mb-3 max-w-2xl mx-auto">
          Your neighborhood already has a star cook.
          <br />
          Let&apos;s help people find them.
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
          Whether that&apos;s you, or someone you know — Sivan Cooks exists to make the introduction.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <a href="/apply" className="text-sm bg-copper-600 hover:bg-copper-700 text-white font-semibold px-5 py-2.5 rounded-lg">
            Apply as a Cook
          </a>
          <a
            href="/cooks"
            className="text-sm border border-copper-300 text-leaf-800 hover:border-copper-600 font-semibold px-5 py-2.5 rounded-lg"
          >
            Browse Cooks
          </a>
        </div>
      </section>
    </>
  )
}
