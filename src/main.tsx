import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { publishedContent, readDraft } from "./content";
import { useHash } from "./hooks/useHash";
import Storefront from "./store/Storefront";
import "./index.css";

// Loaded on demand so storefront visitors never download the editor.
const AdminApp = lazy(() => import("./admin/AdminApp"));

// Read once: a preview shows the draft as it was when the tab opened.
const previewDraft = new URLSearchParams(window.location.search).has("preview") ? { draft: readDraft() } : null;
// GitHub Pages can't send frame-blocking headers, so refuse to show the editor inside another site's frame.
const framed = window.top !== window.self;

function Root() {
  if (useHash().startsWith("admin")) return framed ? null : <Suspense fallback={null}><AdminApp /></Suspense>;
  return (
    <>
      <Storefront content={previewDraft?.draft ?? publishedContent} />
      {previewDraft && (
        <div className="preview-banner" role="status">
          {previewDraft.draft ? "Previewing unpublished changes" : "No unpublished changes to preview"}{" "}
          <a href={`${import.meta.env.BASE_URL}#admin`}>Back to editor</a>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Root /></StrictMode>);
