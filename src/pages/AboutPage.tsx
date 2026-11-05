import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentStats, gaps, source, techniques } from '../domain/content';
import { clearPersonalData, exportPersonalData, importPersonalData, type PersonalExport } from '../storage/db';
import { TerminologySwitch } from '../components/common';
import { LanguageSwitch, useI18n } from '../i18n/I18nProvider';
import { techName, techReviewNotes } from '../i18n/localize';

export function AboutPage() {
  const { s, lang } = useI18n();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 3500);
  };

  const doExport = async () => {
    const data = await exportPersonalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.about.fileName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as PersonalExport;
      await importPersonalData(data);
      flash(s.about.imported);
    } catch (e) {
      flash(e instanceof Error && e.message === 'NOT_EXPORT' ? s.about.notExport : s.about.importFailed);
    }
  };

  const review = techniques.filter((t) => t.status === 'til-gennemsyn');
  const en = lang === 'en';

  return (
    <div className="fade-in stack" style={{ maxWidth: 860 }}>
      <div>
        <div className="eyebrow">{s.about.eyebrow}</div>
        <h1>{s.about.title}</h1>
      </div>

      <div className="disclaimer" role="note">
        <strong>{s.about.disclaimerStrong}</strong> {s.about.disclaimer}
      </div>

      <section className="card card-l">
        <h2>{s.about.source}</h2>
        <p><strong>{en ? source.titleEn : source.title}</strong> · {source.copyright}</p>
        <p className="soft small">{en ? source.rightsEn : source.rights}</p>
        <div className="row" style={{ margin: '8px 0 14px' }}>
          <span className="badge badge-source">{s.about.fromSource(contentStats.confirmed)}</span>
          <span className="badge badge-review">{s.about.review(contentStats.needsReview)}</span>
          <span className="badge badge-missing">{s.about.missing(gaps.length)}</span>
          <span className="badge">{s.about.muscles(contentStats.muscles)}</span>
        </div>
        <ul className="small soft">
          {(en ? source.notesEn : source.notes).map((n) => <li key={n}>{n}</li>)}
        </ul>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{s.about.thPage}</th><th>{s.about.thContent}</th><th>{s.about.thStatus}</th><th>{s.about.thFile}</th></tr></thead>
            <tbody>
              {source.pages.map((p, i) => (
                <tr key={i}>
                  <td>{p.page === 'forside' && en ? 'cover' : p.page}</td>
                  <td>{en ? p.contentEn : p.content}</td>
                  <td>
                    <span className={`badge ${p.status === 'læst' ? 'badge-source' : p.status === 'dublet' ? '' : 'badge-missing'}`}>{en ? p.statusEn : p.status}</span>
                  </td>
                  <td className="small muted">{p.image ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-l">
        <h2>{s.about.marking}</h2>
        <dl className="kv">
          <dt>{s.about.mFromSource}</dt><dd>{s.about.mFromSourceText}</dd>
          <dt>{s.about.mReview}</dt><dd>{s.about.mReviewText}</dd>
          <dt>{s.about.mMuscle}</dt><dd>{s.about.mMuscleText}</dd>
          <dt>{s.about.mIllustrations}</dt><dd>{s.about.mIllustrationsText}</dd>
          <dt>{s.about.mHands}</dt><dd>{s.about.mHandsText} <Link to="/haandgreb">{s.about.mHandsLink}</Link>.</dd>
          <dt>{s.about.mLanguage}</dt><dd>{s.about.mLanguageText}</dd>
        </dl>
        <details>
          <summary className="small">{s.about.showReview(review.length)}</summary>
          <ul className="small soft">
            {review.map((t) => {
              const notes = techReviewNotes(t, lang);
              return (
                <li key={t.id}>
                  {techName(t, lang)} ({s.common.page(t.source.page)}, {s.common.stepLower(t.step)})
                  {notes.length ? ` – ${notes.join(' ')}` : ` – ${s.about.inferredLink}`}
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      <section className="card card-l">
        <h2>{s.about.settings}</h2>
        <div className="stack" style={{ gap: 10 }}>
          <div className="row"><span className="soft">{s.about.language}</span> <LanguageSwitch /></div>
          <div className="row"><span className="soft">{s.terminology.names}</span> <TerminologySwitch /></div>
        </div>
      </section>

      <section className="card card-l">
        <h2>{s.about.data}</h2>
        <p className="soft">{s.about.dataText}</p>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={() => void doExport()}>{s.about.export}</button>
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>{s.about.import}</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ''; }} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              if (window.confirm(s.about.clearConfirm)) {
                await clearPersonalData();
                flash(s.about.cleared);
              }
            }}
          >
            {s.about.clear}
          </button>
        </div>
      </section>

      {msg && <div className="toast" role="status">{msg}</div>}
    </div>
  );
}
