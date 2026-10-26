export default function manifest() {
  return {
    name: 'Plant Scanner',
    short_name: 'Plants',
    description: 'Identify plants from a photo and get care tips.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f3f7f2',
    theme_color: '#2e7d4f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
