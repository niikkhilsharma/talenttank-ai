import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'logowik.com',
				pathname: '/**',
			},
			{ protocol: 'https', hostname: 'upload.wikimedia.org', pathname: '/**' },
			{ protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '/**' },
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
}

export default nextConfig
