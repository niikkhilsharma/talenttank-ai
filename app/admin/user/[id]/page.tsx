export default async function AllUsersPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <div>AllUsersPage</div>
}
