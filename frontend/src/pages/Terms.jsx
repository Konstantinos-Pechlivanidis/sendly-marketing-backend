import GlassCard from '../components/ui/GlassCard';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service - Sendly SMS Marketing"
        description="Read Sendly's Terms of Service to understand the rules and guidelines for using our platform."
        path="/terms"
      />
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-h1 md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-border-subtle">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <GlassCard className="p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-h2 font-bold mb-4">1. Agreement to Terms</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                By accessing or using Sendly's SMS marketing platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">2. Description of Service</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                Sendly provides an SMS marketing platform that integrates with Shopify stores, allowing merchants to send marketing messages, transactional notifications, and automated campaigns to their customers via SMS.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">3. Account Registration</h2>
              <div className="space-y-4">
                <p className="text-body text-border-subtle leading-relaxed">
                  To use our Service, you must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                  <li>Be at least 18 years old</li>
                  <li>Have a valid Shopify store</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">4. SMS Credits and Billing</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-h3 font-semibold mb-2">4.1 Credit-Based Pricing</h3>
                  <p className="text-body text-border-subtle leading-relaxed">
                    Our Service operates on a credit-based system. You purchase SMS credits, and each SMS message sent consumes one credit. Credits do not expire and can be used at any time.
                  </p>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold mb-2">4.2 Payment Terms</h3>
                  <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                    <li>All payments are processed securely through Stripe</li>
                    <li>Payments are due immediately upon purchase</li>
                    <li>All prices are in EUR or USD as specified</li>
                    <li>Refunds are handled on a case-by-case basis</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold mb-2">4.3 Free Features</h3>
                  <p className="text-body text-border-subtle leading-relaxed">
                    All platform features (campaigns, automations, analytics, etc.) are provided free of charge. You only pay for SMS credits used.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">5. Acceptable Use</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li>Send spam, unsolicited, or illegal messages</li>
                <li>Send messages to recipients who have not provided consent</li>
                <li>Use the Service for fraudulent or malicious purposes</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service to send messages containing hate speech, harassment, or inappropriate content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">6. SMS Consent Requirements</h2>
              <div className="space-y-4">
                <p className="text-body text-border-subtle leading-relaxed">
                  You are responsible for ensuring compliance with SMS marketing regulations:
                </p>
                <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                  <li>You must obtain explicit consent before sending marketing SMS messages</li>
                  <li>All marketing messages must include an unsubscribe option</li>
                  <li>You must honor opt-out requests immediately</li>
                  <li>You must maintain records of consent</li>
                  <li>You must comply with GDPR, TCPA, and other applicable regulations</li>
                </ul>
                <p className="text-body text-border-subtle leading-relaxed mt-4">
                  <strong>Note:</strong> Sendly provides tools to help you manage consent, but you are ultimately responsible for compliance.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">7. Intellectual Property</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by Sendly and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">8. Service Availability</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                We strive to maintain high availability of our Service, but we do not guarantee uninterrupted access. The Service may be unavailable due to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li>Scheduled maintenance</li>
                <li>Technical issues or failures</li>
                <li>Third-party service disruptions</li>
                <li>Force majeure events</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">9. Limitation of Liability</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                To the maximum extent permitted by law, Sendly shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">10. Indemnification</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                You agree to indemnify and hold harmless Sendly from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or violation of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">11. Termination</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li>Your right to use the Service will immediately cease</li>
                <li>Unused SMS credits may be forfeited (subject to our refund policy)</li>
                <li>We may delete your account and data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">12. Changes to Terms</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">13. Governing Law</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the European Union, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">14. Contact Information</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-ice-accent/10 rounded-lg">
                <p className="text-body text-border-subtle">
                  <strong>Email:</strong> <a href="mailto:legal@sendly.com" className="text-ice-accent hover:underline">legal@sendly.com</a>
                </p>
                <p className="text-body text-border-subtle mt-2">
                  <strong>Support:</strong> <a href="mailto:support@sendly.com" className="text-ice-accent hover:underline">support@sendly.com</a>
                </p>
              </div>
            </section>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

