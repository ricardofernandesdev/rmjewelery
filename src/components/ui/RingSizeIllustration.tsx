import React from 'react'

export const RingSizeIllustration: React.FC = () => {
  return (
    <div className="flex flex-col items-center py-8">
      <svg
        width="280"
        height="300"
        viewBox="0 0 280 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-brand-dark"
      >
        {/* Diamond top */}
        <path
          d="M130 30L140 10L150 30L140 60Z"
          fill="currentColor"
          opacity="0.12"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M130 30L150 30" stroke="currentColor" strokeWidth="1.5" />
        <line x1="134" y1="20" x2="146" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />

        {/* Ring band outer */}
        <ellipse cx="140" cy="110" rx="60" ry="58" stroke="currentColor" strokeWidth="2.5" />
        {/* Ring band inner */}
        <ellipse cx="140" cy="110" rx="46" ry="44" stroke="currentColor" strokeWidth="1" opacity="0.25" />

        {/* Diameter line with arrows */}
        <line x1="80" y1="110" x2="200" y2="110" stroke="#C9A961" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="80" cy="110" r="3" fill="#C9A961" />
        <circle cx="200" cy="110" r="3" fill="#C9A961" />

        {/* Diameter label */}
        <text x="140" y="100" textAnchor="middle" fontSize="10" fill="#C9A961" fontWeight="500">
          diâmetro
        </text>

        {/* Vertical guide line */}
        <line x1="140" y1="170" x2="140" y2="210" stroke="currentColor" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" />

        {/* Ruler body */}
        <rect x="50" y="220" width="190" height="32" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />

        {/* Ruler ticks */}
        {Array.from({ length: 38 }).map((_, i) => {
          const x = 55 + i * 4.8
          const isMajor = i % 10 === 0
          const isMid = i % 5 === 0
          const h = isMajor ? 16 : isMid ? 12 : 7
          return (
            <line
              key={i}
              x1={x}
              y1={220}
              x2={x}
              y2={220 + h}
              stroke="currentColor"
              strokeWidth={isMajor ? 1.3 : 0.7}
              opacity={isMajor ? 0.8 : isMid ? 0.5 : 0.35}
            />
          )
        })}

        {/* Ruler numbers */}
        <text x="55" y="248" fontSize="8" fill="currentColor" opacity="0.5" textAnchor="middle">0</text>
        <text x="103" y="248" fontSize="8" fill="currentColor" opacity="0.5" textAnchor="middle">1</text>
        <text x="151" y="248" fontSize="8" fill="currentColor" opacity="0.5" textAnchor="middle">2</text>
        <text x="199" y="248" fontSize="8" fill="currentColor" opacity="0.5" textAnchor="middle">3</text>

        {/* cm label */}
        <text x="220" y="240" fontSize="8" fill="currentColor" opacity="0.4">cm</text>

        {/* Ruler loop/ring */}
        <circle cx="248" cy="236" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  )
}
