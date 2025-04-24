export default function PrivacyPolicy() {
	return (
		<div className="max-w-screen-xl mx-auto my-10 px-4 md:px-8">
			<div className="bg-white shadow-md rounded-lg p-6 md:p-8">
				<h1 className="text-3xl font-bold text-center mb-8">Privacy Policy</h1>

				<div className="mb-6">
					<p className="text-gray-700 mb-4">
						Welcome to Talentank. By accessing and using our platform, you agree to comply with the following terms designed to
						ensure a fair and secure experience for all users.
					</p>
				</div>

				<div className="space-y-6">
					<section>
						<h2 className="text-xl font-semibold mb-3">1. Authenticity of Submissions</h2>
						<p className="text-gray-700">
							All assessment responses submitted through Talentank must be original, accurate, and truthful. Misrepresentation or
							the use of external assistance to manipulate outcomes is not permitted.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold mb-3">2. Platform Integrity and Enforcement</h2>
						<p className="text-gray-700">
							Talentank is committed to maintaining a trusted environment. We reserve the right to suspend or terminate accounts
							found misusing the platform, engaging in fraudulent behavior, or violating our usage guidelines.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold mb-3">3. Subscription and Payments</h2>
						<p className="text-gray-700">
							All subscription payments are governed by our refund and cancellation policies. Please review them carefully before
							subscribing to ensure you understand your rights and obligations.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold mb-3">4. Prohibited Activities</h2>
						<p className="text-gray-700">
							Unauthorized access, data scraping, automated extraction, or any attempt to disrupt the normal functioning of the
							platform is strictly prohibited. Legal action may be taken in response to any violations.
						</p>
					</section>
				</div>

				<div className="mt-8 border-t pt-6">
					<p className="text-gray-700">By continuing to use Talentank, you acknowledge and agree to abide by this policy.</p>
					<p className="mt-4 text-gray-700">
						For any questions or concerns regarding this Privacy Policy, please contact us at{' '}
						<a href="mailto:Support@talentank.in" className="text-blue-600 hover:underline">
							Support@talentank.in
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	)
}
