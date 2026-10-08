/** Banner scroll hint: a sieve shakes cocoa onto a tiramisu square. Animated in index.css (.cocoa-cue). */
export function CocoaScrollCue() {
  return (
    <>
      <svg className="cocoa-cue" viewBox="0 0 80 110" aria-hidden="true" focusable="false">
        <g className="cocoa-sieve">
          <line className="cocoa-line" x1="57" y1="17" x2="74" y2="9" />
          <path d="M23 17 Q40 40 57 17 Z" className="cocoa-sieve-fill" />
          <path className="cocoa-line" d="M23 17 Q40 40 57 17" />
          <line className="cocoa-line" x1="22" y1="17" x2="58" y2="17" />
          <path className="cocoa-line cocoa-mesh" d="M30 22 L50 22 M33 27 L47 27" />
        </g>
        <g>
          {[[35, 34, 1.7], [41, 33, 1.4], [38, 35, 1.8], [44, 34, 1.5], [40, 36, 1.6], [36, 33, 1.3]].map(([cx, cy, r], i) => (
            <circle className="cocoa-dust" cx={cx} cy={cy} r={r} key={i} style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </g>
        <g>
          <rect x="20" y="82" width="40" height="20" rx="3" className="cocoa-cream" />
          <rect x="20" y="88" width="40" height="5" className="cocoa-sponge" />
          <rect x="20" y="97" width="40" height="5" rx="2" className="cocoa-sponge-dark" />
          <rect x="20" y="81" width="40" height="4" rx="2" className="cocoa-top" />
        </g>
      </svg>
      <span className="cocoa-cue-label">Scroll</span>
    </>
  );
}
