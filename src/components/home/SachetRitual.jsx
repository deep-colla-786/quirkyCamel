import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { EPISODES, RITUAL_STEPS, PERKS } from '../../data/episodes';
import { sachetSVG, camel } from '../../utils/svgGenerators';

export default function SachetRitual({ currentEpisodeId, onSelectEpisode }) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEpId, setSelectedEpId] = useState(currentEpisodeId || 'trouble-in-oasis');

  const selectedEp = EPISODES.find((e) => e.id === selectedEpId) || EPISODES[0];

  useEffect(() => {
    if (currentEpisodeId) {
      setSelectedEpId(currentEpisodeId);
    }
  }, [currentEpisodeId]);

  // Auto-advance step every 4s unless user clicks
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const perkIcons = {
    pocket: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    seal: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    one: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    six: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="5" height="7" rx="1" fill="currentColor" />
        <rect x="9.5" y="4" width="5" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="16" y="4" width="5" height="7" rx="1" fill="currentColor" />
        <rect x="3" y="13" width="5" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="9.5" y="13" width="5" height="7" rx="1" fill="currentColor" />
        <rect x="16" y="13" width="5" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  };

  const renderStageSvg = () => {
    const fan = EPISODES.map((x, i) => {
      const px = 52 + i * 28;
      return `<g transform="rotate(${-14 + i * 5.6} ${px + 25} 200)">${sachetSVG(x, { x: px, y: 128, w: 50 })}</g>`;
    }).join('');

    const spark = (x, y, s) =>
      `<path d="M${x} ${y - s}C${x + s * 0.15} ${y - s * 0.15} ${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y} ${x + s * 0.15} ${y + s * 0.15} ${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s} ${x - s * 0.15} ${y + s * 0.15} ${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y} ${x - s * 0.15} ${y - s * 0.15} ${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s}Z" fill="#fff"/>`;

    const svgMarkup = `
      <rect width="440" height="330" fill="#2259B2"/>
      <path d="M440 0 C390 30 420 80 350 96 C400 112 440 90 440 150Z" fill="#C4E539" opacity=".85"/>
      <ellipse cx="220" cy="318" rx="200" ry="16" fill="#0e2554" opacity=".35"/>
      <g class="t boxg">
        <rect x="40" y="186" width="220" height="40" rx="4" fill="#0e2554"/>${fan}
        <rect x="30" y="214" width="240" height="104" rx="8" fill="#2a5fd0"/><rect x="30" y="214" width="240" height="8" rx="4" fill="#3a70e0"/>
        ${camel(108, 228, 84, '#C4E539')}
        <text x="150" y="306" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="700" font-size="11" letter-spacing="3" fill="#C4E539">THE COMPLETE KIT</text>
      </g>
      <g class="t pouchg">
        <ellipse cx="252" cy="176" rx="12" ry="26" fill="none" stroke="#b6d43a" stroke-width="6" transform="rotate(-20 252 176)"/>
        <rect x="258" y="150" width="160" height="130" rx="18" fill="#173f86"/>
      </g>
      <g class="t hs">${sachetSVG(selectedEp, { x: 0, y: 0, w: 200 })}</g>
      <g class="t pouchg">
        <rect x="258" y="196" width="160" height="84" rx="16" fill="#2a5fd0"/>
        <path d="M268 206 H408 M268 270 H408" stroke="#C4E539" stroke-width="2" stroke-dasharray="6 4"/>
        <circle cx="338" cy="198" r="9" fill="#C4E539"/>${camel(310, 222, 56, '#C4E539')}
      </g>
      <g class="t wrist">
        <path d="M460 236 L318 214 Q284 208 276 228 Q270 252 300 258 L460 290Z" fill="#d99a6c"/>
        <path d="M300 222 Q286 218 284 230" stroke="#b97a4e" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M400 222 L460 230 L460 296 L392 282Z" fill="#C4E539"/>
        <ellipse cx="300" cy="240" rx="22" ry="8" fill="${selectedEp.pal.accent}" opacity=".45"/>
      </g>
      <path class="drop" d="M0 -11 C6 -3 9 3 0 8 C-9 3 -6 -3 0 -11Z" fill="${selectedEp.pal.accent}" stroke="#fff" stroke-width="1.5"/>
      <g class="spk">${spark(330, 196, 9)}${spark(272, 206, 6)}${spark(316, 270, 7)}</g>
    `;

    return (
      <svg
        className="stage-svg"
        viewBox="0 0 440 330"
        data-step={activeStep}
        role="img"
        aria-label="Animated illustration of how Quirky Camel sachet is used"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    );
  };

  return (
    <section className="band sachet-sec" id="sachet">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow" style={{ color: 'var(--purple)' }}>
            The Format
          </span>
          <h2 className="bubble b-blue">
            <span className="w">Attar,</span> <span className="w">in</span> <span className="w">a</span> <span className="w">sachet.</span>
          </h2>
          <p>
            Traditional attar lives in a glass bottle with a dabber. Ours comes sealed in a slim, pocket-sized sachet, one fragrance per pack, designed like a collectible card. Each sachet carries its camel’s situation on the front, so you always know which mood you’re tearing into.
          </p>
        </div>

        <div className="sachet-grid">
          <div className="ritual" id="ritual">
            {renderStageSvg()}

            <div className="bar">
              <div>
                <span className="lab">SACHET SHOWN</span>
                <b>{selectedEp.name}</b>
              </div>

              <div className="swatches" role="group" aria-label="Choose a fragrance sachet">
                {EPISODES.map((e) => (
                  <button
                    key={e.id}
                    className="swatch"
                    data-id={e.id}
                    style={{ background: e.pal.bg }}
                    aria-label={`${e.name} sachet`}
                    title={e.name}
                    aria-pressed={e.id === selectedEpId}
                    onClick={() => setSelectedEpId(e.id)}
                  />
                ))}
              </div>

              <button
                className="btn-text"
                onClick={() => onSelectEpisode && onSelectEpisode(selectedEp.id)}
                style={{ color: 'var(--lime)', fontWeight: 700 }}
              >
                Read Episode 0{selectedEp.n} →
              </button>
            </div>
          </div>

          <div>
            <ol className="steps3" aria-label="How to use the sachet">
              {RITUAL_STEPS.map((r, i) => (
                <li key={r.k}>
                  <button
                    data-s={i}
                    aria-pressed={activeStep === i}
                    onClick={() => setActiveStep(i)}
                  >
                    <span className={`num3 n${i}`}>{i + 1}</span>
                    <span>
                      <b>{r.k}</b>
                      <span className="t3">{r.t}</span>
                      <small>{r.d}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="perks">
              {PERKS.map(([k, t, d]) => (
                <div className="perk" key={k}>
                  {perkIcons[k]}
                  <span>
                    <b>{t}</b>
                    {d}
                  </span>
                </div>
              ))}
            </div>

            <p className="fineprint">
              Every sachet comes sealed inside the complete kit. Sachets aren’t sold separately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

SachetRitual.propTypes = {
  currentEpisodeId: PropTypes.string,
  onSelectEpisode: PropTypes.func.isRequired
};
