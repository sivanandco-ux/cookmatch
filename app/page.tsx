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
      <header className="relative overflow-hidden bg-gradient-to-b from-leaf-700 to-leaf-800 text-paper py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brass-light mb-5">
              Home Cooking Marketplace
            </div>
            <h1 className="text-3xl sm:text-4xl leading-tight mb-6 text-paper">
              Every neighborhood has
              <br />
              <span className="text-brass-light">a few incredible cooks.</span>
              <br />
              We help you find them.
            </h1>
            <p className="text-lg text-paper/80 max-w-md mb-8">
              Sivan Cooks connects local families with home cooks making authentic meals, pickles, sweets, snacks, and
              baked goods — the kind of food that usually only travels as far as a phone number passed between
              neighbors.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#onboard" className="bg-copper-600 hover:bg-copper-700 text-white font-semibold px-7 py-3.5 rounded-lg">
                Apply as a Cook →
              </a>
              <a
                href="#what-we-do"
                className="border border-paper/35 hover:border-brass-light hover:text-brass-light text-paper font-semibold px-7 py-3.5 rounded-lg"
              >
                See How It Works
              </a>
            </div>
            <div className="flex gap-8 mt-10 flex-wrap">
              <div>
                <div className="font-display text-2xl text-brass-light">2</div>
                <div className="text-xs text-paper/65">
                  Ways to offer
                  <br />
                  your cooking
                </div>
              </div>
              <div>
                <div className="font-display text-2xl text-brass-light">$0</div>
                <div className="text-xs text-paper/65">
                  Commission on
                  <br />
                  what you earn
                </div>
              </div>
              <div>
                <div className="font-display text-2xl text-brass-light">Concierge</div>
                <div className="text-xs text-paper/65">
                  Guided signup —
                  <br />
                  talk, don&apos;t type
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full rounded-3xl overflow-hidden aspect-[4/5] bg-leaf-800 border border-brass-light/25">
            <div className="hero-slideshow">
              <img className="hero-slide" src="/landing-dishes/pistachio-baklava.jpg" alt="Pistachio baklava made by a cook on Sivan Cooks" />
              <img className="hero-slide" src="/landing-dishes/rasam.jpg" alt="Homemade rasam made by a cook on Sivan Cooks" />
              <img className="hero-slide" src="/landing-dishes/curry-leaf-rice.jpg" alt="Curry leaf rice made by a cook on Sivan Cooks" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-leaf-900/75 to-transparent pointer-events-none" />
            <div className="absolute inset-4 border border-brass-light/30 rounded-2xl pointer-events-none z-10" />
            <div className="absolute left-5 bottom-5 z-10 text-paper text-xs font-semibold">
              Real dishes from cooks in the directory
            </div>
          </div>
        </div>
      </header>

      {/* Who We Are */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-14 items-start">
          <div>
            <div className="font-display text-7xl leading-none text-brass mb-1">&ldquo;</div>
            <p className="font-display text-xl text-leaf-800 leading-snug mb-5">
              Food made by someone who actually cares what you think of it — that&apos;s the whole idea.
            </p>
            <div className="bg-panel border-l-[3px] border-copper-600 rounded p-6 text-[15.5px] leading-relaxed text-gray-600">
              <p className="mb-3.5">
                Growing up in Chennai, India, I was surrounded by home-based businesses — electrical work, packaging,
                spare parts, the small operations that quietly kept everything running. Some of my earliest memories
                aren&apos;t of playgrounds — they&apos;re of listening to my parents and their colleagues debate
                startup ideas around the dinner table in the 1980s. Everyone I knew started small and built something
                real.
              </p>
              <p className="mb-3.5">
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
              <p className="font-semibold text-leaf-800 mt-4">— Founder, Sivan Spices &amp; Sivan Cooks</p>
            </div>
          </div>
          <div>
            <div className="text-[17px] font-semibold text-copper-600 mb-4">Who We Are</div>
            <p className="text-gray-600 mb-4">
              <strong className="text-leaf-800 font-semibold">Sivan Cooks</strong> is a directory and matchmaking
              platform for local culinary artisans — home cooks who make real food, the way it&apos;s made at home,
              not in a commercial kitchen chasing volume.
            </p>
            <p className="text-gray-600 mb-4">
              We built it because the best cooking in any neighborhood usually never leaves that neighborhood. A
              friend&apos;s mother who makes the only mango pickle you&apos;ll ever want. A neighbor who bakes laddus
              for every festival and would happily make a batch for you too, if only you knew to ask.
            </p>
            <p className="text-gray-600">
              Sivan Cooks is how you ask. Clients browse or post what they&apos;re craving; cooks get matched, chat
              directly, and agree on the rest themselves — no middleman marking up the price, no corporate kitchen
              between you and the person who actually cooked your food.
            </p>
          </div>
        </div>
      </section>

      {/* What We're Doing */}
      <section id="what-we-do" className="bg-panel py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-copper-600 mb-3">What We&apos;re Doing</div>
            <h2 className="text-3xl text-leaf-800 mb-3.5">Two ways to share what you cook</h2>
            <p className="text-gray-600">
              Every cook on Sivan Cooks offers one or both of these — whichever fits how they actually like to cook.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {OFFERS.map((offer) => (
              <div key={offer.title} className={`bg-white rounded-2xl p-8 border-l-4 ${offer.accent}`}>
                <div className={`w-11 h-11 rounded-xl ${offer.iconBg} text-white flex items-center justify-center font-display text-xl mb-4`}>
                  {offer.icon}
                </div>
                <h3 className="text-xl text-leaf-800 mb-2.5">{offer.title}</h3>
                <p className="text-gray-600 text-[15px]">{offer.body}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
            {HOW_IT_WORKS.map(([title, body], i) => (
              <div key={title}>
                <div className="w-8 h-8 rounded-full border-[1.5px] border-copper-300 text-copper-600 font-display text-sm flex items-center justify-center mb-3">
                  {i + 1}
                </div>
                <h4 className="font-semibold text-sm text-leaf-800 mb-1">{title}</h4>
                <p className="text-[13.5px] text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Want to Onboard */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div id="onboard" className="relative overflow-hidden bg-leaf-700 text-paper rounded-3xl p-8 sm:p-16">
          <div className="max-w-xl mb-10 relative">
            <div className="text-xs font-semibold uppercase tracking-widest text-brass-light mb-3">Who We Want to Onboard</div>
            <h2 className="text-3xl sm:text-4xl text-paper mb-3.5">
              If people already ask you to cook for them, you belong here.
            </h2>
            <p className="text-paper/80">
              We&apos;re not looking for restaurant experience or a commercial kitchen. We&apos;re looking for the
              cook everyone already knows about.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 relative">
            {TRAITS.map(([title, body]) => (
              <div key={title} className="border-t border-brass-light/30 pt-4">
                <h4 className="font-display text-lg text-brass-light mb-2">{title}</h4>
                <p className="text-sm text-paper/75">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center gap-5 flex-wrap relative">
            <a href="/apply" className="bg-copper-600 hover:bg-copper-700 text-white font-semibold px-7 py-3.5 rounded-lg">
              Apply to Become a Cook →
            </a>
            <p className="text-sm text-paper/65">Takes about 10 minutes. No cooking résumé required.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-24 px-6">
        <h2 className="text-3xl sm:text-4xl text-leaf-800 mb-4 max-w-2xl mx-auto">
          Your neighborhood already has a star cook.
          <br />
          Let&apos;s help people find them.
        </h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
          Whether that&apos;s you, or someone you know — Sivan Cooks exists to make the introduction.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/apply" className="bg-copper-600 hover:bg-copper-700 text-white font-semibold px-7 py-3.5 rounded-lg">
            Apply as a Cook
          </a>
          <a
            href="/cooks"
            className="border border-copper-300 text-leaf-800 hover:border-copper-600 font-semibold px-7 py-3.5 rounded-lg"
          >
            Browse Cooks
          </a>
        </div>
      </section>
    </>
  )
}
