const MeditrailLogo = ({ width = 80 }) => (
  <svg width={width} viewBox="0 0 200 200" role="img" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B2F6E"/>
        <stop offset="100%" stopColor="#5B6A8A"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="180" height="180" rx="36" fill="url(#bgGrad)"/>
    <text
      x="100" y="106"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="sans-serif"
      fontSize="64"
      fontWeight="700"
      fill="#ffffff"
      transform="rotate(-90, 100, 100)"
    >MT</text>
  </svg>
);

export default MeditrailLogo;