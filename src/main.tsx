import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { publishedContent, readDraft } from "./content";
import { useHash } from "./hooks/useHash";
import Storefront from "./store/Storefront";
import "./index.css";

// Loaded on demand so storefront visitors never download the editor.
const AdminApp = lazy(() => import("./admin/AdminApp"));

const isPreview = new URLSearchParams(window.location.search).has("preview");

function Root() {
  const isAdmin = useHash().startsWith("admin");
  if (isAdmin) return <Suspense fallback={null}><AdminApp /></Suspense>;

  const draft = isPreview ? readDraft() : null;
  return (
    <>
      <Storefront content={draft ?? publishedContent} />
      {isPreview && <div className="preview-banner" role="status">{draft ? "Previewing unpublished changes" : "No unpublished changes to preview"} <a href={`${import.meta.env.BASE_URL}#admin`}>Back to editor</a></div>}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Root /></StrictMode>);
