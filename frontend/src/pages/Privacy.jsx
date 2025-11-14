import GlassCard from '../components/ui/GlassCard';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy - Sendly SMS Marketing"
        description="Read Sendly's Privacy Policy to understand how we collect, use, and protect your data."
        path="/privacy"
      />
      <div className="min-h-screen pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-h1 md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-border-subtle">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <GlassCard className="p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-h2 font-bold mb-4">1. Introduction</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                Welcome to Sendly ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our products and services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SMS marketing platform for Shopify.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-h3 font-semibold mb-2">2.1 Information You Provide</h3>
                  <p className="text-body text-border-subtle leading-relaxed">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-2 text-body text-border-subtle ml-4">
                    <li>Account information (name, email address, Shopify store domain)</li>
                    <li>Contact information for your customers (phone numbers, names, email addresses)</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Communication data when you contact us for support</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold mb-2">2.2 Automatically Collected Information</h3>
                  <p className="text-body text-border-subtle leading-relaxed">
                    We automatically collect certain information when you use our service:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-2 text-body text-border-subtle ml-4">
                    <li>Usage data and analytics</li>
                    <li>Device information and IP address</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li>Provide, maintain, and improve our SMS marketing services</li>
                <li>Process transactions and send related information</li>
                <li>Send SMS messages on your behalf to your customers</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">4. GDPR Compliance</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                Sendly is fully compliant with the General Data Protection Regulation (GDPR). We respect your rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li><strong>Right to Access:</strong> You can request access to your personal data</li>
                <li><strong>Right to Rectification:</strong> You can correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> You can limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> You can receive your data in a structured format</li>
                <li><strong>Right to Object:</strong> You can object to certain types of processing</li>
              </ul>
              <p className="text-body text-border-subtle leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@sendly.com" className="text-ice-accent hover:underline">privacy@sendly.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">5. SMS Consent and Opt-Out</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                We are committed to SMS marketing best practices:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li>We only send SMS messages to customers who have provided explicit consent</li>
                <li>All SMS messages include an unsubscribe option</li>
                <li>We honor opt-out requests immediately</li>
                <li>We maintain records of consent and opt-out requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-body text-border-subtle leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-border-subtle ml-4">
                <li>With service providers who assist us in operating our platform (e.g., SMS providers, payment processors)</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">7. Data Security</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">8. Data Retention</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-h2 font-bold mb-4">11. Contact Us</h2>
              <p className="text-body text-border-subtle leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-ice-accent/10 rounded-lg">
                <p className="text-body text-border-subtle">
                  <strong>Email:</strong> <a href="mailto:privacy@sendly.com" className="text-ice-accent hover:underline">privacy@sendly.com</a>
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

