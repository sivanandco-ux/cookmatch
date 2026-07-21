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
          Sivan Cooks ("Sivan Cooks," "we," "us") operates a free planning and information tool that helps people
          decide whether turning their cooking into a side income makes sense — walking through an income goal, the
          legal path that fits how they'd cook and sell, and the real costs involved. By using Sivan Cooks in any way
          — browsing the site or using the planning tool — you agree to these Terms of Service ("Terms").
        </p>
        <p>
          <strong>Sivan Cooks is not a marketplace, directory, or matchmaking service.</strong> We do not connect you
          with clients or cooks, list anyone for hire, process payments, or take a commission on anything. We do not
          prepare, sell, or deliver food, and we do not employ, contract, manage, or supervise any cook.
        </p>
      </Section>

      <Section title="2. Not Professional Advice">
        <p>
          Sivan Cooks provides general planning information and estimates — including figures about permit fees,
          revenue caps, and legal categories — for educational purposes only. This is <strong>not legal, tax, or
          professional advice</strong>, and using it does not create any advisor relationship between you and Sivan
          Cooks. Requirements vary by state and county, change over time, and may not be fully or currently reflected
          here.
        </p>
        <p>
          Before you rely on anything shown by Sivan Cooks — including any fee, cap, or legal category — confirm it
          directly with the relevant state or county agency, and consult a licensed attorney or tax professional for
          advice specific to your situation.
        </p>
      </Section>

      <Section title="3. No Warranty">
        <p>
          THE PLATFORM AND ALL CONTENT ON IT, INCLUDING ANY ESTIMATE, FEE, CAP, OR OTHER FIGURE SHOWN BY THE PLANNING
          TOOL, ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED,
          INCLUDING WITHOUT LIMITATION WARRANTIES OF ACCURACY, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
          NON-INFRINGEMENT. SIVAN COOKS DOES NOT WARRANT THAT ANY INFORMATION ON THE PLATFORM IS CURRENT, COMPLETE,
          OR ACCURATE FOR YOUR SPECIFIC SITUATION.
        </p>
      </Section>

      <Section title="4. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, SIVAN COOKS AND ITS FOUNDERS, OWNERS, EMPLOYEES, AND AFFILIATES
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
          OR FOR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-1">
          <li>Any decision you make based on information or estimates shown by Sivan Cooks</li>
          <li>Any inaccuracy, omission, or outdated figure in the platform's content</li>
          <li>Your access to or use of, or inability to access or use, the platform</li>
        </ul>
        <p>
          IN NO EVENT WILL SIVAN COOKS' TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING
          TO THESE TERMS OR THE PLATFORM EXCEED ONE HUNDRED U.S. DOLLARS ($100). SOME STATES DO NOT ALLOW THE
          EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU IN
          FULL, IN WHICH CASE LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY YOUR STATE'S LAW.
        </p>
      </Section>

      <Section title="5. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless Sivan Cooks and its founders, owners, employees, and
          affiliates from any claim, demand, loss, liability, or expense (including reasonable attorneys' fees)
          arising out of or related to: your use of the platform; your violation of these Terms or any law; or any
          decision or action you take based on information from the platform.
        </p>
      </Section>

      <Section title="6. Other Features on This Site">
        <p>
          From time to time, Sivan Cooks may make other features available on this site beyond the planning tool. Any
          such feature is provided on the same "as is," no-warranty, limited-liability basis described above, and
          Sivan Cooks may modify or remove it at any time without notice.
        </p>
      </Section>

      <Section title="7. Disputes With Sivan Cooks">
        <p>
          If you have a claim against Sivan Cooks, you agree to first try to resolve it informally by contacting{' '}
          <a href="/contact" className="text-copper-600 underline">Contact Us</a>. Sivan Cooks is a small,
          founder-run service without dedicated legal staff, and does not agree to participate in formal mediation or
          arbitration proceedings. If a claim cannot be resolved informally, it may be brought in small claims court
          in the jurisdiction where it qualifies, to the extent the claim falls within that court's monetary and
          subject-matter limits.
        </p>
        <p>
          You agree not to bring, and waive any right to bring or participate in, a class action, class arbitration,
          or representative action against Sivan Cooks. Where applicable law does not permit enforcement of this
          waiver, this provision (and only this provision) will not apply, and the claim will instead proceed on an
          individual basis in the courts described in Section 8.
        </p>
      </Section>

      <Section title="8. Governing Law and Venue">
        <p>
          These Terms are governed by the laws of the State of California, without regard to conflict-of-laws
          principles, except where a user's home-state consumer protection law mandates that a different state's
          law apply to that user, in which case that mandatory law applies solely to the extent required.
        </p>
        <p>
          Subject to Section 7, any dispute not brought in small claims court will proceed in the state or federal
          courts located in California, and you consent to personal jurisdiction there — unless applicable law in
          your state of residence requires that the dispute instead be litigated in your home state, in which case
          venue will lie in the state or federal courts located in your state of residence.
        </p>
      </Section>

      <Section title="9. Content and Conduct">
        <p>
          You are responsible for anything you submit through Sivan Cooks. You agree not to submit anything false,
          misleading, illegal, or infringing on someone else's rights. Sivan Cooks may remove content or restrict
          access to the platform at any time and for any reason, including suspected violation of these Terms or
          applicable law.
        </p>
      </Section>

      <Section title="10. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will update the "Last
          updated" date above. Continued use of Sivan Cooks after changes take effect constitutes acceptance of the
          updated Terms.
        </p>
      </Section>

      <Section title="11. Severability and Entire Agreement">
        <p>
          If any provision of these Terms is found unenforceable, the remaining provisions will remain in full
          force and effect, and the unenforceable provision will be modified to the minimum extent necessary to
          make it enforceable while preserving its intent. These Terms are the entire agreement between you and
          Sivan Cooks regarding your use of the platform.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms can be sent through our{' '}
          <a href="/contact" className="text-copper-600 underline">Contact Us</a> page.
        </p>
      </Section>
    </div>
  )
}
