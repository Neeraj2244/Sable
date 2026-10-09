import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Icon } from "../components/Icon";
import { assetUrl, DRAFT_STORAGE_KEY, normalizeContent, publishedContent, readDraft } from "../content";
import { iconNames, type IconName, type SiteContent } from "../content/types";
import { useDialog } from "../hooks/useDialog";
import { getJson, setJson } from "../lib/storage";
import { authConfigured, sessionKey, signIn, signOut, type Bytes } from "./auth";
import { checkAccess, defaultConfig, loadConfig, publishContent, saveConfig, uploadImage, type GitHubConfig } from "./github";
import { optimiseImage } from "./image";
import { findLimitErrors, sections, type Field, type ListField } from "./schema";
import "./admin.css";

type Path = (string | number)[];
type Status = { tone: "info" | "success" | "error"; text: string; link?: { href: string; label: string } } | null;

const PUBLISHED_KEY = "sable-admin-published";

// Lets field editors read other parts of the draft (e.g. the category list for a product's dropdown).
const DraftContext = createContext<SiteContent>(publishedContent);

function setIn<T>(target: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const copy = (Array.isArray(target) ? [...target] : { ...(target as object) }) as Record<string | number, unknown>;
  copy[head] = setIn(copy[head], rest, value);
  return copy as T;
}

function getIn(target: unknown, path: Path): unknown {
  return path.reduce<unknown>((value, key) => (value as Record<string | number, unknown> | undefined)?.[key], target);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export default function AdminApp() {
  // undefined while checking the stored session; null when signed out.
  const [secret, setSecret] = useState<Bytes | null | undefined>(undefined);
  useEffect(() => { void sessionKey().then(setSecret); }, []);
  if (secret === undefined) return null;
  if (!secret) return <LoginScreen onSignedIn={() => void sessionKey().then(setSecret)} />;
  return <Editor secret={secret} onSignOut={() => { signOut(); setSecret(null); }} />;
}

function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const ok = await signIn(email, password);
    setBusy(false);
    if (ok) onSignedIn();
    else setError("That email and password don’t match.");
  };

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <span className="admin-login-mark"><Icon name="lock" size={22} /></span>
        <h1>Admin sign in</h1>
        <p>Edit everything on the website.</p>
        {!authConfigured ? (
          <div className="admin-alert admin-alert-error">Sign-in isn’t set up for this build. Add the <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> secrets in GitHub, then redeploy.</div>
        ) : (
          <>
            <label className="admin-field"><span>Email</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus /></label>
            <label className="admin-field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
            <button className="admin-button admin-button-primary admin-button-block" type="submit" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
          </>
        )}
        <a className="admin-back-link" href={import.meta.env.BASE_URL}><Icon name="arrow-left" size={15} /> Back to the website</a>
      </form>
    </div>
  );
}

function Editor({ secret, onSignOut }: { secret: Bytes; onSignOut: () => void }) {
  const [baseline, setBaseline] = useState<SiteContent>(() => {
    const raw = getJson<unknown>(PUBLISHED_KEY);
    const stored = raw ? normalizeContent(raw) : null;
    // Once the rebuilt site carries what we published, forget the local copy.
    if (!stored || same(stored, publishedContent)) {
      setJson(PUBLISHED_KEY, null);
      return publishedContent;
    }
    return stored;
  });
  const [draft, setDraft] = useState<SiteContent>(() => readDraft() ?? baseline);
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const [config, setConfig] = useState<GitHubConfig>(defaultConfig);
  useEffect(() => { void loadConfig(secret).then(setConfig); }, [secret]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [publishing, setPublishing] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const importRef = useRef<HTMLInputElement>(null);
  const changed = useMemo(() => new Set(sections.filter((item) => !same(draft[item.id], baseline[item.id])).map((item) => item.id)), [draft, baseline]);
  const dirty = changed.size > 0;
  const section = sections.find((item) => item.id === activeId) ?? sections[0];
  const previewUrls = useRef<string[]>([]);
  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    setJson(DRAFT_STORAGE_KEY, dirty ? draft : null);
  }, [draft, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (path: Path, value: unknown) => setDraft((current) => setIn(current, path, value));

  const needsToken = () => {
    if (config.token && config.repo) return false;
    setSettingsOpen(true);
    setStatus({ tone: "info", text: "Connect GitHub first so changes can be published." });
    return true;
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    if (needsToken()) return null;
    // SVG and other formats can carry script that would run on the site origin.
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      setStatus({ tone: "error", text: "Please upload a JPG, PNG, WebP or AVIF photo." });
      return null;
    }
    setStatus({ tone: "info", text: `Optimising and uploading ${file.name}…` });
    try {
      const image = await optimiseImage(file);
      if (image.size > 5 * 1024 * 1024) throw new Error("It is still over 5 MB after optimising; please use a smaller photo.");
      const path = await uploadImage(config, image, file.name);
      const preview = URL.createObjectURL(image);
      previewUrls.current.push(preview);
      setImagePreviews((current) => ({ ...current, [path]: preview }));
      setStatus({ tone: "success", text: "Image uploaded. Publish to put it on the site." });
      return path;
    } catch (error) {
      setStatus({ tone: "error", text: `Upload failed. ${(error as Error).message}` });
      return null;
    }
  };

  const publish = async () => {
    const tooLong = findLimitErrors(draft);
    if (tooLong.length) {
      const first = tooLong[0];
      setStatus({ tone: "error", text: `${first.section} → ${first.item ? `${first.item} → ` : ""}${first.field} is ${first.length} characters; the limit is ${first.max}.${tooLong.length > 1 ? ` ${tooLong.length - 1} more field(s) are also too long.` : ""}` });
      return;
    }
    if (needsToken()) return;
    setPublishing(true);
    setStatus({ tone: "info", text: "Publishing…" });
    try {
      await publishContent(config, draft);
      setBaseline(draft);
      setJson(PUBLISHED_KEY, draft);
      setStatus({ tone: "success", text: "Published. The live site updates in about 1–2 minutes.", link: { href: `https://github.com/${config.repo}/actions`, label: "Watch the deploy" } });
    } catch (error) {
      setStatus({ tone: "error", text: `Couldn’t publish. ${(error as Error).message}` });
    } finally {
      setPublishing(false);
    }
  };

  const discard = () => {
    if (!window.confirm("Throw away all unpublished changes?")) return;
    setDraft(baseline);
    setStatus({ tone: "info", text: "Unpublished changes discarded." });
  };

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(draft, null, 2)}\n`], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `site-content-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text()) as Partial<SiteContent>;
      // Older backups may lack newer sections; those are filled from the live site.
      const missing = sections.filter((item) => typeof raw[item.id] !== "object").map((item) => item.title);
      if (missing.length === sections.length) throw new Error("It doesn’t contain any site sections.");
      setDraft(normalizeContent(raw));
      setStatus({ tone: "success", text: missing.length ? `Backup loaded. ${missing.join(", ")} came from the live site. Review, then publish.` : "Backup loaded. Review it, then publish." });
    } catch (error) {
      setStatus({ tone: "error", text: `That file isn’t a valid backup. ${(error as Error).message}` });
    }
  };

  const openPreview = () => {
    setJson(DRAFT_STORAGE_KEY, dirty ? draft : null);
    window.open(`${import.meta.env.BASE_URL}?preview=1`, "_blank", "noopener");
  };

  const saveSettings = async (next: GitHubConfig) => {
    await saveConfig(next, secret);
    setConfig(await loadConfig(secret));
    setSettingsOpen(false);
    setStatus({ tone: "success", text: next.remember ? "Publishing settings saved on this device." : "Publishing settings saved until you close this tab." });
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-title"><strong>Site editor</strong><span className={`admin-badge${dirty ? " admin-badge-dirty" : ""}`}>{dirty ? "Unpublished changes" : "Up to date"}</span></div>
        <div className="admin-topbar-actions">
          <button className="admin-button" type="button" onClick={openPreview}>Preview</button>
          <button className="admin-button" type="button" onClick={discard} disabled={!dirty}>Discard</button>
          <button className="admin-button admin-button-primary" type="button" onClick={publish} disabled={!dirty || publishing}>{publishing ? "Publishing…" : "Publish"}</button>
        </div>
      </header>

      {status && (
        <div className={`admin-status admin-alert admin-alert-${status.tone}`} role="status">
          <span>{status.text} {status.link && <a href={status.link.href} target="_blank" rel="noreferrer">{status.link.label} ↗</a>}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setStatus(null)}><Icon name="close" size={14} /></button>
        </div>
      )}

      <div className="admin-body">
        <nav className="admin-sidebar" aria-label="Sections">
          <label className="admin-section-select"><span className="sr-only">Section</span><select value={activeId} onChange={(event) => setActiveId(event.target.value)}>{sections.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
          <ul>
            {sections.map((item) => {
              return <li key={item.id}><button type="button" className={item.id === activeId ? "is-active" : ""} aria-current={item.id === activeId ? "page" : undefined} onClick={() => setActiveId(item.id)}>{item.title}{changed.has(item.id) && <span className="admin-dot"><span className="sr-only"> (changed)</span></span>}</button></li>;
            })}
          </ul>
          <div className="admin-sidebar-footer">
            <button type="button" onClick={() => setSettingsOpen(true)}><Icon name="shield" size={15} /> Publishing settings</button>
            <button type="button" onClick={exportJson}><Icon name="arrow-up-right" size={15} /> Download backup</button>
            <button type="button" onClick={() => importRef.current?.click()}><Icon name="plus" size={15} /> Load backup</button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
            <a href={import.meta.env.BASE_URL}><Icon name="arrow-left" size={15} /> View website</a>
            <button type="button" onClick={onSignOut}><Icon name="close" size={15} /> Sign out</button>
          </div>
        </nav>

        <DraftContext.Provider value={draft}>
        <main className="admin-main">
          <div className="admin-section-head">
            <h1>{section.title}</h1>
            <p>{section.description}</p>
          </div>
          <div className="admin-fields">
            {section.fields.map((field) => (
              <FieldEditor key={`${section.id}.${field.key}`} field={field} value={getIn(draft, [section.id, field.key])} onChange={(value) => update([section.id, field.key], value)} onUpload={handleUpload} previews={imagePreviews} />
            ))}
          </div>
        </main>
        </DraftContext.Provider>
      </div>

      {settingsOpen && <SettingsDialog config={config} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />}
    </div>
  );
}

type EditorProps = { value: unknown; onChange: (value: unknown) => void; onUpload: (file: File) => Promise<string | null>; previews: Record<string, string> };

function FieldEditor({ field, ...props }: EditorProps & { field: Field }) {
  if (field.type === "list") return <ListEditor field={field} {...props} />;
  return <ScalarEditor field={field} {...props} />;
}

function ScalarEditor({ field, ...props }: EditorProps & { field: Exclude<Field, ListField> }) {
  const id = useId();
  const { categories } = useContext(DraftContext).menu;
  const { value, onChange } = props;
  const text = String(value ?? "");
  const labelId = `${id}-label`;

  let control;
  if (field.type === "textarea") {
    control = <textarea id={id} rows={Math.min(8, Math.max(3, text.split("\n").length + 1))} maxLength={field.max} value={text} onChange={(event) => onChange(event.target.value)} />;
  } else if (field.type === "number") {
    control = <div className="admin-number"><span>₹</span><input id={id} type="number" min={0} step={1} inputMode="numeric" value={Number(value ?? 0)} onChange={(event) => onChange(Math.max(0, Math.round(Number(event.target.value) || 0)))} /></div>;
  } else if (field.type === "image") {
    control = <ImagePicker id={id} {...props} />;
  } else if (field.type === "icon") {
    control = <IconPicker labelledBy={labelId} value={value as IconName} onChange={onChange} />;
  } else if (field.type === "category") {
    control = <select id={id} value={text} onChange={(event) => onChange(event.target.value)}><option value="">No category</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name || "Untitled category"}</option>)}</select>;
  } else if (field.type === "color") {
    control = <div className="admin-color"><input id={id} type="color" value={String(value || "#000000")} onChange={(event) => onChange(event.target.value)} /><input aria-label={`${field.label} hex`} value={text} onChange={(event) => onChange(event.target.value)} /></div>;
  } else {
    control = <input id={id} type={field.type === "email" || field.type === "url" ? field.type : "text"} maxLength={field.max} value={text} onChange={(event) => onChange(event.target.value)} />;
  }

  return (
    <div className="admin-field">
      <label id={labelId} htmlFor={field.type === "icon" ? undefined : id}>{field.label}</label>
      {control}
      {(field.hint || field.max) && (
        <div className="admin-field-foot">
          {field.hint && <small>{field.hint}</small>}
          {field.max && <small className={`admin-counter${text.length > field.max ? " is-over" : ""}`} aria-live="polite">{text.length}/{field.max}</small>}
        </div>
      )}
    </div>
  );
}

function ImagePicker({ id, value, onChange, onUpload, previews }: EditorProps & { id: string }) {
  const [busy, setBusy] = useState(false);
  const path = String(value ?? "");
  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    const uploaded = await onUpload(file);
    setBusy(false);
    if (uploaded) onChange(uploaded);
  };
  return (
    <div className="admin-image">
      <img src={previews[path] ?? assetUrl(path)} alt="" />
      <div>
        <label className="admin-button" htmlFor={id}>{busy ? "Uploading…" : "Upload new photo"}</label>
        <input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={choose} disabled={busy} />
        <input className="admin-image-path" aria-label="Image path or URL" value={path} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

// Interface icons (arrows, close…) make no sense as section illustrations.
const PICKABLE_ICONS = iconNames.filter((name) => !["arrow-left", "arrow-right", "arrow-up-right", "plus", "minus", "close", "menu", "chevron-down"].includes(name));

function IconPicker({ value, onChange, labelledBy }: { value: IconName; onChange: (value: unknown) => void; labelledBy: string }) {
  return (
    <div className="admin-icons" role="radiogroup" aria-labelledby={labelledBy}>
      {PICKABLE_ICONS.map((name) => (
        <button type="button" role="radio" aria-checked={value === name} aria-label={name} title={name} className={value === name ? "is-active" : ""} onClick={() => onChange(name)} key={name}><Icon name={name} size={18} /></button>
      ))}
    </div>
  );
}

function ListEditor({ field, value, onChange, onUpload, previews }: EditorProps & { field: ListField }) {
  const items = (Array.isArray(value) ? value : []) as unknown[];
  const [open, setOpen] = useState<number | null>(null);

  const replaceAt = (index: number, next: unknown) => onChange(items.map((entry, i) => (i === index ? next : entry)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
    setOpen(open === from ? to : open === to ? from : open);
  };
  const remove = (index: number) => {
    const title = field.itemTitle ? field.itemTitle(items[index] as Record<string, unknown>) : String(items[index] || `this ${field.singular}`);
    if (!window.confirm(`Delete “${title}”?`)) return;
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
    setOpen(null);
  };
  const add = () => {
    onChange([...items, field.newItem()]);
    setOpen(items.length);
  };

  return (
    <div className="admin-field admin-list">
      <div className="admin-list-head"><span className="admin-list-label">{field.label} <em>{items.length}</em></span></div>
      <ol>
        {items.map((item, index) => {
          const controls = (
            <div className="admin-list-controls">
              <button type="button" aria-label="Move up" onClick={() => move(index, index - 1)} disabled={index === 0}><Icon name="chevron-down" size={15} className="admin-flip" /></button>
              <button type="button" aria-label="Move down" onClick={() => move(index, index + 1)} disabled={index === items.length - 1}><Icon name="chevron-down" size={15} /></button>
              <button type="button" aria-label={`Delete ${field.singular}`} className="admin-danger" onClick={() => remove(index)}><Icon name="close" size={15} /></button>
            </div>
          );

          if (!field.item) {
            return <li className="admin-list-row" key={index}><input aria-label={`${field.singular} ${index + 1}`} value={String(item ?? "")} onChange={(event) => replaceAt(index, event.target.value)} />{controls}</li>;
          }

          const record = item as Record<string, unknown>;
          const isOpen = open === index;
          const image = field.item.find((sub) => sub.type === "image");
          return (
            <li className={`admin-list-item${isOpen ? " is-open" : ""}`} key={(record.id as string) ?? index}>
              <div className="admin-list-item-head">
                <button type="button" className="admin-list-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : index)}>
                  {image && <img src={previews[String(record[image.key])] ?? assetUrl(String(record[image.key] ?? ""))} alt="" />}
                  <span>{field.itemTitle?.(record)}</span>
                  <Icon name="chevron-down" size={16} className={isOpen ? "admin-flip" : ""} />
                </button>
                {controls}
              </div>
              {isOpen && (
                <div className="admin-list-item-body">
                  {field.item.map((sub) => <FieldEditor key={sub.key} field={sub} value={record[sub.key]} onChange={(next) => replaceAt(index, { ...record, [sub.key]: next })} onUpload={onUpload} previews={previews} />)}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" className="admin-button admin-add" onClick={add}><Icon name="plus" size={15} /> Add {field.singular}</button>
    </div>
  );
}

function SettingsDialog({ config, onClose, onSave }: { config: GitHubConfig; onClose: () => void; onSave: (config: GitHubConfig) => void }) {
  const [form, setForm] = useState(config);
  const [check, setCheck] = useState<Status>(null);
  const ref = useDialog<HTMLFormElement>(true, onClose);

  const test = async () => {
    setCheck({ tone: "info", text: "Checking…" });
    try {
      await checkAccess(form);
      setCheck({ tone: "success", text: "Connected. This token can publish." });
    } catch (error) {
      setCheck({ tone: "error", text: (error as Error).message });
    }
  };

  return (
    <div className="admin-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form ref={ref} className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <div className="admin-dialog-head"><h2 id="settings-title">Publishing settings</h2><button type="button" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button></div>
        <p>Publishing saves your changes to GitHub, which rebuilds the site. This needs a GitHub token, kept only in this browser.</p>
        <details className="admin-howto">
          <summary>How to get a token</summary>
          <ol>
            <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">GitHub → Fine-grained tokens</a>.</li>
            <li>Under <strong>Repository access</strong>, choose <em>Only select repositories</em> and pick this site’s repository.</li>
            <li>Under <strong>Permissions → Repository</strong>, set <em>Contents</em> to <em>Read and write</em>.</li>
            <li>Generate the token and paste it below.</li>
          </ol>
        </details>
        <label className="admin-field"><span>GitHub token</span><input type="password" autoComplete="off" value={form.token} onChange={(event) => setForm({ ...form, token: event.target.value })} placeholder="github_pat_…" /></label>
        <div className="admin-dialog-row">
          <label className="admin-field"><span>Repository</span><input value={form.repo} onChange={(event) => setForm({ ...form, repo: event.target.value })} placeholder="owner/repo" /></label>
          <label className="admin-field"><span>Branch</span><input value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} placeholder="main" /></label>
        </div>
        {check && <div className={`admin-alert admin-alert-${check.tone}`}>{check.text}</div>}
        <label className="admin-check"><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /><span><strong>Remember on this device</strong><small>Leave off on shared computers. Off means you paste the token again after closing the tab.</small></span></label>
        <div className="admin-dialog-actions">
          <button type="button" className="admin-button" onClick={test} disabled={!form.token || !form.repo}>Test connection</button>
          <button type="submit" className="admin-button admin-button-primary">Save</button>
        </div>
      </form>
    </div>
  );
}
