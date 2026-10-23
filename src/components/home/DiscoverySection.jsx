import React, { useState } from 'react';
import { EPISODES, ROUTES, OCC_LABELS } from '../../data/episodes';
import { SCENES, sachetSVG } from '../../utils/svgGenerators';

export default function DiscoverySection({ onSelectEpisode }) {
  const [activeRoute, setActiveRoute] = useState('mood');
  const [selectedChip, setSelectedChip] = useState(null);

  const routeConfig = ROUTES[activeRoute];

  const handleTabChange = (routeKey) => {
    setActiveRoute(routeKey);
    setSelectedChip(null);
  };

  const handleChipClick = (chipKey) => {
    setSelectedChip((prev) => (prev === chipKey ? null : chipKey));
  };

  const getFilteredEpisodes = () => {
    return EPISODES.map((ep) => {
      const matches = !selectedChip || ep.f[activeRoute]?.includes(selectedChip);
      return { ep, matches };
    }).sort((a, b) => (b.matches ? 1 : 0) - (a.matches ? 1 : 0));
  };

  const filteredList = getFilteredEpisodes();
  const matchCount = filteredList.filter((item) => item.matches).length;

  let note = '';
  if (activeRoute === 'scent') {
    note = 'Camel After Dark joins this filter once its final notes are confirmed.';
  }
  if (activeRoute === 'occ') {
    note = 'No episode is tailored for conservative office wear yet.';
  }

  return (
    <section className="band episodes squig" id="episodes">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow" style={{ color: 'var(--lime)' }}>
              The Collection
            </span>
            <h2 className="bubble b-lime">
              <span className="w">Six</span> <span className="w">episodes.</span>{' '}
              <span className="w">One</span> <span className="w">strange</span> <span className="w">world.</span>
            </h2>
            <p>
              Same camel, different situation, one sachet each. Read the mood before the notes, and find the episode that sounds like your day.
            </p>
          </div>
        </div>

        <div className="discover" id="discover" role="region" aria-label="Discover the collection">
          <div className="tabs" role="tablist">
            {Object.entries(ROUTES).map(([key, r]) => (
              <button
                key={key}
                className="tab"
                role="tab"
                aria-selected={activeRoute === key}
                onClick={() => handleTabChange(key)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="chips" role="group" aria-label={routeConfig.label}>
            {routeConfig.opts.map(([k, label]) => {
              const count = EPISODES.filter((e) => e.f[activeRoute]?.includes(k)).length;
              return (
                <button
                  key={k}
                  className="chip"
                  aria-pressed={selectedChip === k}
                  disabled={count === 0}
                  onClick={() => handleChipClick(k)}
                >
                  {label}
                  <span className="c">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="disc-foot">
            <span id="discCount">
              <b>{matchCount} of 6</b> episodes {selectedChip ? 'match' : 'showing'}
            </span>
            {note && <span className="disc-note">{note}</span>}
            {selectedChip && (
              <button className="clear-filter" onClick={() => setSelectedChip(null)}>
                Clear filter
              </button>
            )}
          </div>
        </div>

        <div className="ep-grid" id="epGrid">
          {filteredList.map(({ ep, matches }) => {
            const epVars = {
              '--ep-ink': ep.pal.deep,
              '--ep-accent': ep.pal.accent,
              '--ep-soft': ep.pal.soft
            };

            return (
              <div
                key={ep.id}
                className={`ep-card ${!matches ? 'dim' : ''}`}
                style={epVars}
                onClick={() => onSelectEpisode && onSelectEpisode(ep.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onSelectEpisode && onSelectEpisode(ep.id);
                  }
                }}
              >
                <div className="scene">
                  <div dangerouslySetInnerHTML={{ __html: SCENES[ep.id]() }} />
                  <span className="num">EPISODE 0{ep.n}</span>
                  <span className="inkit">IN THE KIT</span>
                  <span
                    className="peek"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: sachetSVG(ep) }}
                  />
                </div>

                <div className="body">
                  <h3 style={{ color: ep.pal.deep }}>{ep.name}</h3>
                  <p className="hl" style={{ color: ep.pal.hl }}>
                    “{ep.headline}”
                  </p>
                  <p className="d">{ep.body}</p>

                  <div className="tags">
                    {ep.traits.slice(0, 3).map((t) => (
                      <span key={t} className="tag m">
                        {t}
                      </span>
                    ))}
                    {ep.audience && (
                      <span className="tag">
                        {ep.id === 'madam-camel' ? 'For her' : 'Unisex'}
                      </span>
                    )}
                  </div>

                  <div className="occ">
                    {ep.f.occ.map((o) => (
                      <span key={o}>
                        <span className="occ-dot" />
                        {OCC_LABELS[o]}
                      </span>
                    ))}
                  </div>

                  <div className="go">
                    <span>Explore the episode</span>
                    <i aria-hidden="true">→</i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
