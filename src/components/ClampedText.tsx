import { useId, useRef, useState } from "react";
import { useResize } from "../hooks/useResize";

/**
 * Text clamped to a few lines (set in CSS) with a "Read more" / "Read less"
 * toggle that only appears when the text actually overflows. Re-measures on
 * resize and once web fonts load, since both change where lines wrap.
 */
export function ClampedText({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useResize(ref, () => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    void document.fonts?.ready.then(measure);
  }, [text, expanded]);

  return (
    <div className="clamped">
      <p ref={ref} id={id} className={`${className} clamped-text${expanded ? " is-expanded" : ""}`}>{text}</p>
      {(overflows || expanded) && (
        <button type="button" className="read-more" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((open) => !open)}>
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}
