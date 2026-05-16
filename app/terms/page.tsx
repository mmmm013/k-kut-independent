export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-semibold text-amber-400 hover:underline">
          Back to K-KUT
        </a>

        <h1 className="mt-8 text-4xl font-black text-amber-400">
          Terms of Service
        </h1>

        <p className="mt-4 text-sm text-neutral-400">
          Effective date: May 4, 2026
        </p>

        <section className="mt-8 space-y-4 text-neutral-200">
          <p>
            K-KUT is operated by G Putnam Music, LLC. These Terms of Service explain
            the basic terms for using K-KUT services, including digital music delivery,
            digital experience delivery, customer-care activity, support, scheduling,
            and transactional SMS communications.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Use of K-KUT</h2>
          <p className="mt-3 text-neutral-200">
            By using K-KUT, you agree to use the service only for lawful, personal,
            customer, or authorized business purposes. You may not misuse the service,
            attempt to disrupt the service, copy protected content without permission,
            or use K-KUT to send abusive, deceptive, unlawful, or unauthorized messages.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Digital Delivery</h2>
          <p className="mt-3 text-neutral-200">
            K-KUT may provide secure digital delivery links for purchased or requested
            digital music, media, or experience-related content. Delivery links are
            intended for the customer or authorized recipient and may be subject to
            access controls, expiration, replay limits, or other delivery restrictions.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Orders and Support</h2>
          <p className="mt-3 text-neutral-200">
            K-KUT may use information you provide to process orders, provide digital
            delivery, manage scheduling, respond to support requests, and provide
            customer-care updates.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">SMS Terms</h2>

          <p className="mt-3 text-neutral-200">
            By checking the SMS consent box or otherwise opting in, you agree to receive
            transactional SMS messages from G Putnam Music/K-KUT about your K-KUT order,
            digital delivery, scheduling, account, customer-care activity, or support
            request.
          </p>

          <p className="mt-3 text-neutral-200">
            Message frequency varies. Message and data rates may apply. Reply STOP to
            opt out. Reply HELP for help.
          </p>

          <p className="mt-3 text-neutral-200">
            Consent to receive SMS messages is not a condition of purchase. Email
            delivery or support may be available as an alternative where applicable.
          </p>

          <p className="mt-3 text-neutral-200">
            Carriers are not liable for delayed or undelivered messages.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">No Marketing Without Consent</h2>
          <p className="mt-3 text-neutral-200">
            K-KUT SMS messages under this service are transactional and customer-care
            related. K-KUT does not use transactional SMS consent for third-party
            marketing, affiliate marketing, or unrelated promotional messaging.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Intellectual Property</h2>
          <p className="mt-3 text-neutral-200">
            K-KUT, G Putnam Music content, audio, music, names, designs, delivery
            experiences, and related materials may be protected by copyright, trademark,
            trade secret, contractual, or other rights. You may not copy, reproduce,
            distribute, modify, resell, or commercially exploit K-KUT content unless
            expressly authorized in writing.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Service Providers</h2>
          <p className="mt-3 text-neutral-200">
            G Putnam Music/K-KUT may use service providers to operate the website,
            process payments, host services, deliver communications, and support
            customer service. Service providers are used only as needed to operate and
            support the service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Limitation of Service</h2>
          <p className="mt-3 text-neutral-200">
            K-KUT is provided as a digital music, media, delivery, and customer-care
            service. K-KUT does not provide medical, legal, financial, counseling, or
            emergency services.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Changes to These Terms</h2>
          <p className="mt-3 text-neutral-200">
            G Putnam Music/K-KUT may update these Terms from time to time. The effective
            date above will reflect the current version.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-amber-300">Contact</h2>
          <p className="mt-3 text-neutral-200">
            For terms, SMS, or customer-care questions, contact G Putnam Music/K-KUT at{" "}
            <a
              href="mailto:reachus@gputnammusic.com"
              className="text-amber-400 hover:underline"
            >
              reachus@gputnammusic.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
