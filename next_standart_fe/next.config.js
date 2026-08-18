/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/assets/:path*',
                destination: `${process.env.PUBLIC_ASSET_ORG}/:path*`,
            },
        ];
    }
}

module.exports = nextConfig
