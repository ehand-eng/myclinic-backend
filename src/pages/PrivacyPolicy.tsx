import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-28 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl bg-white p-8 md:p-12 rounded-lg shadow-sm">
          <h1 className="font-poppins text-3xl font-bold text-medilab-heading mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-medilab-body">
            <section>
              <h2 className="text-xl font-semibold text-medilab-heading mb-3">1. Information We Collect</h2>
              <p className="mb-2">We collect information to provide better services to all our users. Information we collect includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Information:</strong> Name, phone number, email address, and demographic information you provide during booking.</li>
                <li><strong>Usage Data:</strong> Information about how you use our application, including interactions with our WhatsApp bot.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-medilab-heading mb-3">2. How We Use Information</h2>
              <p className="mb-2">We use the information we collect from all of our services for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To facilitate appointment booking and schedule management.</li>
                <li>To send you SMS or WhatsApp notifications about your appointments.</li>
                <li>To communicate with you regarding updates, offers, and support.</li>
                <li>To analyze and improve the performance of our application.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-medilab-heading mb-3">3. Data Sharing and Disclosure</h2>
              <p>We do not share personal information with companies, organizations, and individuals outside of MyClinic unless one of the following circumstances applies:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>With your consent:</strong> We will share personal information with companies, organizations, or individuals outside of MyClinic when we have your consent to do so.</li>
                <li><strong>For healthcare provision:</strong> Information is shared directly with the doctors and dispensaries you book with.</li>
                <li><strong>For legal reasons:</strong> We will share personal information if we have a good-faith belief that access, use, preservation, or disclosure of the information is reasonably necessary to meet any applicable law, regulation, legal process, or enforceable governmental request.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-medilab-heading mb-3">4. Data Security</h2>
              <p>We work hard to protect MyClinic and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use secure protocols (HTTPS) and encrypt sensitive data where appropriate.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-medilab-heading mb-3">5. Changes to this Policy</h2>
              <p>Our Privacy Policy may change from time to time. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-medilab-heading mb-3">6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <p className="mt-2 text-medilab-primary font-medium">booking@docspot-connect.com</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
