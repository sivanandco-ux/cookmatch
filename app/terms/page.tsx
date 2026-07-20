export const metadata = { title: 'Terms of Service — Sivan Cooks' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed flex flex-col gap-3">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: July 2026</p>

      <Section title="1. What Sivan Cooks Is">
        <p>
          Sivan Cooks ("Sivan Cooks," "we," "us") operates a directory and introduction platform that helps
          independent home cooks ("Cooks") and people seeking home-cooked food ("Clients") find and communicate
          with each other. By using Sivan Cooks in any way — browsing, applying as a Cook, posting a request, or
          messaging — you agree to these Terms of Service ("Terms").
        </p>
        <p>
          <strong>Sivan Cooks does not prepare, handle, package, sell, deliver, or serve any food.</strong> We are
          not a restaurant, caterer, food distributor, or food seller of any kind. We do not employ, contract,
          manage, or supervise any Cook. Every session, item, price, and arrangement is negotiated and agreed to
          directly between a Cook and a Client, without Sivan Cooks as a party to that agreement. Sivan Cooks does
          not process payments and does not take a commission on any transaction between a Cook and a Client.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old and able to form a binding contract to use Sivan Cooks. By registering
          as a Cook or Client, you represent that all information you provide is accurate and that you have the
          legal right and authority to enter into the arrangements you make through the platform.
        </p>
      </Section>

      <Section title="3. Independent Cooks — Not Employees or Agents">
        <p>
          Cooks are independent, self-employed individuals. Nothing in these Terms, and nothing about a Cook's use
          of Sivan Cooks, creates an employment, agency, joint venture, or partnership relationship between the
          Cook and Sivan Cooks. Cooks do not act on Sivan Cooks' behalf, and Sivan Cooks does not direct, control,
          or supervise how a Cook prepares, stores, handles, prices, or delivers food.
        </p>
        <p>Every Cook is solely responsible for:</p>
        <ul className="list-disc pl-6 flex flex-col gap-1">
          <li>Complying with all federal, state, and local laws applicable to preparing and selling food from a home kitchen, including any cottage food law, home-kitchen operation permit, food handler certification, business license, or health department registration required in their jurisdiction</li>
          <li>The safety, sanitation, quality, ingredients, allergen disclosure, and labeling of any food they prepare or sell</li>
          <li>Carrying any insurance (general liability, product liability, or otherwise) they consider necessary or that is legally required for their activities</li>
          <li>Setting and collecting their own prices and payment directly from Clients</li>
          <li>The accuracy of their own profile, photos, and descriptions</li>
        </ul>
        <p>Sivan Cooks does not verify, license, insure, or guarantee compliance with any of the above.</p>
      </Section>

      <Section title="4. Clients — Direct Dealing and Assumption of Risk">
        <p>
          Clients deal directly with Cooks to arrange, confirm, and pay for any session or item. Sivan Cooks is not
          a party to that arrangement and has no obligation to mediate, guarantee, refund, or resolve disputes
          arising from it.
        </p>
        <p>
          <strong>
            By requesting, purchasing, or consuming food obtained through a Cook found on Sivan Cooks, you
            voluntarily assume all risks associated with that food, including but not limited to foodborne
            illness, allergic reaction, and any other health consequence.
          </strong>{' '}
          If you have food allergies, dietary restrictions, or health conditions relevant to what you eat, you are
          responsible for discussing them directly with the Cook before consuming anything.
        </p>
      </Section>

      <Section title="5. No Verification, No Warranty">
        <p>
          Sivan Cooks may review basic application information before a Cook's profile is activated, but this is
          not a background check, identity verification, food safety inspection, license verification, or
          certification of any kind, and should not be relied on as one. Any badge, status, or description shown on
          the platform is provided as-is and is not a guarantee of a Cook's skill, safety practices, legal
          compliance, or trustworthiness.
        </p>
        <p>
          THE PLATFORM AND ALL CONTENT ON IT ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY
          KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT. SIVAN COOKS DOES NOT WARRANT THAT ANY FOOD, COOK, OR
          LISTING WILL MEET YOUR EXPECTATIONS OR BE SAFE, LEGAL, OR OF ANY PARTICULAR QUALITY.
        </p>
      </Section>

      <Section title="6. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, SIVAN COOKS AND ITS FOUNDERS, OWNERS, EMPLOYEES, AND AFFILIATES
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
          OR FOR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-1">
          <li>Any food prepared, sold, delivered, or consumed in connection with a Cook found through Sivan Cooks</li>
          <li>Any interaction, transaction, dispute, injury, illness, or property damage arising between a Cook and a Client</li>
          <li>Your access to or use of, or inability to access or use, the platform</li>
          <li>Any conduct or content of any Cook or Client, whether online or offline</li>
        </ul>
        <p>
          IN NO EVENT WILL SIVAN COOKS' TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING
          TO THESE TERMS OR THE PLATFORM EXCEED ONE HUNDRED U.S. DOLLARS ($100). SOME STATES DO NOT ALLOW THE
          EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU IN
          FULL, IN WHICH CASE LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY YOUR STATE'S LAW.
        </p>
      </Section>

      <Section title="7. Release">
        <p>
          If you have a dispute with one or more Cooks or Clients, you release Sivan Cooks (and its founders,
          owners, employees, and affiliates) from any and all claims, demands, and damages of every kind, known and
          unknown, arising out of or in any way connected with that dispute. If you are a California resident, you
          waive California Civil Code §1542, which says: <em>"A general release does not extend to claims that the
          creditor or releasing party does not know or suspect to exist in his or her favor at the time of
          executing the release, which if known by him or her would have materially affected his or her settlement
          with the debtor or released party."</em> A comparable provision of any other state's law is waived to the
          same extent.
        </p>
      </Section>

      <Section title="8. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless Sivan Cooks and its founders, owners, employees, and
          affiliates from any claim, demand, loss, liability, or expense (including reasonable attorneys' fees)
          arising out of or related to: your use of the platform; your violation of these Terms or any law; any
          food you prepare, sell, or serve (if you are a Cook); or any dispute between you and another user.
        </p>
      </Section>

      <Section title="9. Disputes Between Cooks and Clients">
        <p>
          Sivan Cooks is not a party to, and has no obligation to investigate, mediate, arbitrate, or otherwise get
          involved in resolving, any dispute between a Cook and a Client. Any such dispute — including anything
          related to food quality, safety, pricing, payment, cancellation, or conduct — is solely between the Cook
          and the Client involved.
        </p>
      </Section>

      <Section title="10. Disputes With Sivan Cooks">
        <p>
          If you have a claim against Sivan Cooks itself, you agree to first try to resolve it informally by
          contacting <a href="/contact" className="text-copper-600 underline">Contact Us</a>. Sivan Cooks is a
          small, founder-run platform without dedicated legal staff, and does not agree to participate in formal
          mediation or arbitration proceedings. If a claim cannot be resolved informally, it may be brought in
          small claims court in the jurisdiction where it qualifies, to the extent the claim falls within that
          court's monetary and subject-matter limits.
        </p>
        <p>
          You agree not to bring, and waive any right to bring or participate in, a class action, class
          arbitration, or representative action against Sivan Cooks. Where applicable law does not permit
          enforcement of this waiver, this provision (and only this provision) will not apply, and the claim will
          instead proceed on an individual basis in the courts described in Section 11.
        </p>
      </Section>

      <Section title="11. Governing Law and Venue">
        <p>
          These Terms are governed by the laws of the State of California, without regard to conflict-of-laws
          principles, except where a user's home-state consumer protection law mandates otherwise for that user.
          Subject to Section 10, any dispute not brought in small claims court will proceed in the state or federal
          courts located in California, and you consent to personal jurisdiction there.
        </p>
      </Section>

      <Section title="12. Content and Conduct">
        <p>
          You are responsible for anything you post, upload, or send through Sivan Cooks, including profile
          information, photos, messages, and reviews. You agree not to post anything false, misleading, illegal,
          or infringing on someone else's rights. Sivan Cooks may remove content or suspend or terminate any
          account, at any time and for any reason, including suspected violation of these Terms or applicable law.
        </p>
      </Section>

      <Section title="13. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will update the "Last
          updated" date above. Continued use of Sivan Cooks after changes take effect constitutes acceptance of the
          updated Terms.
        </p>
      </Section>

      <Section title="14. Severability and Entire Agreement">
        <p>
          If any provision of these Terms is found unenforceable, the remaining provisions will remain in full
          force and effect, and the unenforceable provision will be modified to the minimum extent necessary to
          make it enforceable while preserving its intent. These Terms are the entire agreement between you and
          Sivan Cooks regarding your use of the platform.
        </p>
      </Section>

      <Section title="15. Contact">
        <p>
          Questions about these Terms can be sent through our{' '}
          <a href="/contact" className="text-copper-600 underline">Contact Us</a> page.
        </p>
      </Section>
    </div>
  )
}
