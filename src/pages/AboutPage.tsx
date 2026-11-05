import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentStats, gaps, source, techniques } from '../domain/content';
import { clearPersonalData, exportPersonalData, importPersonalData, type PersonalExport } from '../storage/db';
import { TerminologySwitch } from '../components/common';

export function AboutPage() {
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
    a.download = `massageatlas-mine-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as PersonalExport;
      await importPersonalData(data);
      flash('Dine data er importeret.');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Import mislykkedes.');
    }
  };

  const review = techniques.filter((t) => t.status === 'til-gennemsyn');

  return (
    <div className="fade-in stack" style={{ maxWidth: 860 }}>
      <div>
        <div className="eyebrow">Om MassageAtlas</div>
        <h1>Indhold, kilder og dine data</h1>
      </div>

      <div className="disclaimer" role="note">
        <strong>Uddannelsesreference.</strong> MassageAtlas er et studieværktøj og ikke et diagnose- eller behandlingsværktøj.
        Appen giver ingen anbefalinger om behandling eller terapeutisk effekt. Følg altid din uddannelses retningslinjer og din underviser.
      </div>

      <section className="card card-l">
        <h2>Kildemateriale</h2>
        <p><strong>{source.title}</strong> · {source.copyright}</p>
        <p className="soft small">{source.rights}</p>
        <div className="row" style={{ margin: '8px 0 14px' }}>
          <span className="badge badge-source">{contentStats.confirmed} greb direkte fra kilden</span>
          <span className="badge badge-review">{contentStats.needsReview} til gennemsyn</span>
          <span className="badge badge-missing">{gaps.length} trin mangler</span>
          <span className="badge">{contentStats.muscles} muskelposter</span>
        </div>
        <ul className="small soft">
          {source.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Side</th><th>Indhold</th><th>Status</th><th>Billedfil</th></tr></thead>
            <tbody>
              {source.pages.map((p, i) => (
                <tr key={i}>
                  <td>{p.page}</td>
                  <td>{p.content}</td>
                  <td>
                    <span className={`badge ${p.status === 'læst' ? 'badge-source' : p.status === 'dublet' ? '' : 'badge-missing'}`}>{p.status}</span>
                  </td>
                  <td className="small muted">{p.image ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-l">
        <h2>Sådan er indholdet markeret</h2>
        <dl className="kv">
          <dt>Fra kilden</dt>
          <dd>Billedteksten er transskriberet ordret, og beskrivelsen er en selvstændig omskrivning. Muskler er kun koblet, hvis de er nævnt i teksten.</dd>
          <dt>Til gennemsyn</dt>
          <dd>Grebet har afledte muskelkoblinger (ud fra det beskrevne område), stavefejl i kilden eller uklare formuleringer. Se noten på grebet.</dd>
          <dt>Muskeldata</dt>
          <dd>Udspring, hæfte og funktion er almindelig lærebogsanatomi – ikke fra hæftet – og er markeret til gennemsyn.</dd>
          <dt>Illustrationer</dt>
          <dd>Alle figurer er originale, forenklede tegninger. Hæftets fotos er ikke indlejret i appen.</dd>
          <dt>Håndgreb</dt>
          <dd>
            Hvert greb har en tegning af håndstillingen (kontaktpunkt, håndvinkel og bevægelsesretning) lavet ud fra hæftets foto.
            Uklare detaljer er markeret ”til gennemsyn”. <Link to="/haandgreb">Gennemse alle illustrationer</Link>.
          </dd>
        </dl>
        <details>
          <summary className="small">Vis greb til gennemsyn ({review.length})</summary>
          <ul className="small soft">
            {review.map((t) => (
              <li key={t.id}>
                {t.name} (side {t.source.page}, trin {t.step})
                {t.reviewNotes.length ? ` – ${t.reviewNotes.join(' ')}` : ' – afledt muskelkobling'}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="card card-l">
        <h2>Indstillinger</h2>
        <div className="row"><span className="soft">Muskelnavne:</span> <TerminologySwitch /></div>
      </section>

      <section className="card card-l">
        <h2>Dine data</h2>
        <p className="soft">Favoritter, noter, quizhistorik og indstillinger gemmes kun i denne browser (IndexedDB). Der er ingen konto og ingen synkronisering. Tag en sikkerhedskopi, hvis du skifter browser eller enhed.</p>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={() => void doExport()}>Eksportér mine data</button>
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>Importér</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ''; }} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              if (window.confirm('Slet alle dine favoritter, noter og quizresultater på denne enhed?')) {
                await clearPersonalData();
                flash('Dine data er slettet.');
              }
            }}
          >
            Slet mine data
          </button>
        </div>
      </section>

      {msg && <div className="toast" role="status">{msg}</div>}
    </div>
  );
}
