import React, { useState } from 'react';
import { EPISODES, PRICE, formatINR, MOOD_LABELS } from '../data/episodes';
import { SCENES, sachetSVG, sachetBackSVG } from '../utils/svgGenerators';
import { Info, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';

export default function EpisodeView({
  episode,
  onAddToCart,
  onSelectEpisode,
  onBackHome
}) {
  const [flipped, setFlipped] = useState(false);
  const [tiltTransform, setTiltTransform] = useState('');

  if (!episode) return null;

  const currentIndex = EPISODES.findIndex((e) => e.id === episode.id);
  const prevEp = EPISODES[(currentIndex + 5) % 6];
  const nextEp = EPISODES[(currentIndex + 1) % 6];

  const handlePointerMove = (ev) => {
    const card = ev.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    const baseRotation = flipped ? 'rotateY(180deg) ' : '';
    setTiltTransform(`${baseRotation}rotateY(${x * 24}deg) rotateX(${-y * 24}deg)`);
  };

  const handlePointerLeave = () => {
    setTiltTransform(flipped ? 'rotateY(180deg)' : '');
  };

  const toggleFlip = () => {
    const nextState = !flipped;
    setFlipped(nextState);
    setTiltTransform(nextState ? 'rotateY(180deg)' : '');
  };

  const epThemeStyle = {
    '--ep-bg': episode.pal.bg,
    '--ep-ink': episode.pal.ink,
    '--ep-accent': episode.pal.accent,
    '--ep-soft': episode.pal.soft,
    '--ep-deep': episode.pal.deep,
    '--ep-accent2': episode.pal.accent2,
    '--ep-title': episode.pal.title,
    '--ep-btn': episode.pal.btnBg,
    '--ep-btnink': episode.pal.btnInk
  };

  return (
    <div id="episodeView" style={epThemeStyle}>
      <section className="ep-hero">
        <div className="wrap">
          <div className="crumbs">
            <button className="crumb-btn" onClick={onBackHome}>
              Home
            </button>
            <span>/</span>
            <button className="crumb-btn" onClick={onBackHome}>
              The Episodes
            </button>
            <span>/</span>
            <span style={{ color: 'var(--ep-accent)' }}>{episode.name}</span>
          </div>

          <div className="grid">
            <div
              className="big-scene"
              id="bigScene"
              dangerouslySetInnerHTML={{ __html: SCENES[episode.id]() }}
            />

            <div className="flyin">
              <span className="epno">EPISODE 0{episode.n} OF 06</span>
              <h1 className="bubble" style={{ color: episode.pal.title }}>
                {episode.name}
              </h1>
              <p className="hl" style={{ color: episode.pal.title }}>
                “{episode.headline}”
              </p>
              <p className="lede">{episode.body}</p>

              <div className="cta-row">
                <button
                  className="btn"
                  style={{
                    background: episode.pal.btnBg,
                    color: episode.pal.btnInk,
                    boxShadow: '0 5px 0 rgba(0,0,0,.3)'
                  }}
                  onClick={() => onAddToCart && onAddToCart(1)}
                >
                  <ShoppingBag size={18} />
                  Get in Complete Kit · {formatINR(PRICE)}
                </button>
                <span className="note">
                  Comes as a sealed sachet in the complete kit, alongside the other five episodes.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ep-body">
        <div className="wrap">
          <div className="facts">
            <article className="fact world">
              <h3>The World</h3>
              <p>{episode.world}</p>
            </article>

            <article className="fact scent">
              <h3>Scent Direction</h3>
              <p>{episode.scent}</p>
              <div className="tags" style={{ marginTop: '12px' }}>
                {episode.scentTags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>

              {episode.pending && (
                <div className="pending">
                  <Info size={18} />
                  <span>Exact notes will be confirmed from the final fragrance formulation.</span>
                </div>
              )}

              {episode.note && (
                <div
                  className="pending"
                  style={{ background: 'var(--ep-soft)', color: 'var(--ep-deep)' }}
                >
                  <Info size={18} />
                  <span>{episode.note}</span>
                </div>
              )}
            </article>

            <article className="fact pers">
              <h3>Personality</h3>
              <div className="trait-list">
                {episode.traits.map((t) => (
                  <span key={t} className="trait">
                    {t}
                  </span>
                ))}
              </div>
              <p style={{ marginTop: '14px', fontSize: '15px' }}>{episode.persona}</p>
            </article>

            <article className="fact occ">
              <h3>Wear It For</h3>
              <ul className="occ-list">
                {episode.occasions.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </article>

            <article className="fact who">
              <h3>Mood & Aura</h3>
              <div className="tags">
                {episode.f.mood.map((m) => (
                  <span key={m} className="tag m">
                    {MOOD_LABELS[m]}
                  </span>
                ))}
              </div>
              <h3 style={{ marginTop: '18px' }}>Made For</h3>
              <p>{episode.audience || 'Anyone who likes this kind of situation.'}</p>
            </article>

            <article className="fact look">
              <div
                className={`tilt-card ${flipped ? 'flip' : ''}`}
                id="tiltCard"
                role="button"
                tabIndex={0}
                aria-label={`${episode.name} sachet, click to flip`}
                onClick={toggleFlip}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <div
                  className="in"
                  style={{ transform: tiltTransform }}
                >
                  <div
                    className="f"
                    dangerouslySetInnerHTML={{ __html: sachetSVG(episode) }}
                  />
                  <div
                    className="f b"
                    dangerouslySetInnerHTML={{ __html: sachetBackSVG(episode) }}
                  />
                </div>
              </div>

              <div className="look-copy">
                <h3>The Sachet (Interactive 3D Card)</h3>
                <p>
                  <b>{episode.name}</b> comes sealed in its own pocket-sized attar sachet featuring this illustrated scene.
                  Tear at the notch and swipe directly onto your wrists and pulse points.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '10px' }}>
                  Tap or click the sachet to flip between front and back views!
                </p>

                <h3 style={{ marginTop: '18px' }}>The Scene</h3>
                <p>{episode.look}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="band ep-kit squig">
        <div className="wrap">
          <div>
            <span className="eyebrow" style={{ color: 'var(--lime)' }}>
              The Complete Kit
            </span>
            <h2 className="bubble b-lime">
              <span className="w">This</span> <span className="w">camel</span> <span className="w">comes</span>{' '}
              <span className="w">with</span> <span className="w">five</span> <span className="w">friends</span>
            </h2>
            <p>
              {episode.name} is one sachet in a collectible series of six. The complete kit is the only way to get it, so you get every episode in one box.
            </p>
            <div className="cta-row">
              <button className="btn lime" onClick={() => onAddToCart && onAddToCart(1)}>
                Add the complete kit · {formatINR(PRICE)}
              </button>
              <button className="btn ghost" onClick={onBackHome}>
                Explore all episodes
              </button>
            </div>
          </div>

          <div className="six">
            {EPISODES.map((x) => (
              <button
                key={x.id}
                className={`six-card-btn ${x.id === episode.id ? 'this' : ''}`}
                onClick={() => onSelectEpisode && onSelectEpisode(x.id)}
                aria-label={x.name}
              >
                <div dangerouslySetInnerHTML={{ __html: sachetSVG(x) }} />
                <span>{x.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <nav className="ep-nav" aria-label="Episode pagination">
        <div className="wrap">
          <button className="ep-nav-link" onClick={() => onSelectEpisode(prevEp.id)}>
            <small>
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
              EPISODE 0{prevEp.n}
            </small>
            <b>{prevEp.name}</b>
          </button>
          <button className="ep-nav-link next" onClick={() => onSelectEpisode(nextEp.id)}>
            <small>
              EPISODE 0{nextEp.n}
              <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4 }} />
            </small>
            <b>{nextEp.name}</b>
          </button>
        </div>
      </nav>
    </div>
  );
}
