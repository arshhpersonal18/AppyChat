/**
 * Generates an SVG Data URL avatar with clean typography and gradient background.
 */
export function generateInitialsAvatar(name: string, identifier?: string): string {
  const cleanName = (name || 'User').trim();
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || cleanName.slice(0, 2).toUpperCase() || 'U';

  // Seeded color palette based on name/identifier
  const seed = (cleanName + (identifier || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const gradients = [
    { from: '#00A878', to: '#005C42' },
    { from: '#0D9488', to: '#115E59' },
    { from: '#059669', to: '#047857' },
    { from: '#10B981', to: '#065F46' },
    { from: '#34D399', to: '#059669' },
    { from: '#14B8A6', to: '#0F766E' },
    { from: '#2DD4BF', to: '#0D9488' },
    { from: '#008F65', to: '#004D36' },
  ];

  const colorPair = gradients[seed % gradients.length];
  const uniqueId = `grad_${seed % 1000}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorPair.from}"/>
        <stop offset="100%" stop-color="${colorPair.to}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#${uniqueId})"/>
    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="'Poppins', -apple-system, sans-serif" font-weight="600" font-size="38" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateIdentifier(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ar-${randomNum}`;
}
