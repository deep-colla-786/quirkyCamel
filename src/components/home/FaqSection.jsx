import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { FAQS } from '../../data/episodes';

export default function FaqSection({ onSpinClick, onShopKit, onSelectEpisode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = FAQS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colors = ['var(--purple)', 'var(--orange)', 'var(--blue)', 'var(--lime)'];

  const toggleFaq = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className="band faq" id="faq">
      <div className="wrap">
        <div className="faq-side">
          <span className="eyebrow" style={{ color: 'var(--purple)' }}>
            Before You Snap
          </span>
          <h2 className="bubble b-blue">
            <span className="w">Questions,</span> <span className="w">answered</span>
          </h2>
          <p className="intro">
            Everything about our attar sachets, the six episodes, alcohol-free oil quality, and the complete kit in one place.
          </p>

          <label className="qsearch" htmlFor="qSearch">
            <Search size={18} color="var(--muted)" />
            <input
              id="qSearch"
              type="search"
              placeholder="Search questions, e.g. “sachet”, “alcohol”"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <div className="ask">
            <span className="icon" style={{ height: '46px', color: 'var(--lime)' }} />
            <b>Still deciding?</b>
            <p>Let the desert pick a camel for you, or take all six home and switch situations whenever you like.</p>
            <div className="cta-row">
              <button className="btn lime" onClick={onSpinClick}>
                Spin a situation
              </button>
              <button className="btn ghost" onClick={onShopKit}>
                Shop the kit
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="qa">
            {filteredFaqs.map((faq, idx) => {
              const bg = colors[idx % 4];
              const fg = idx % 4 === 1 || idx % 4 === 3 ? 'var(--ink)' : 'var(--white)';
              const isOpen = openIndex === idx;

              return (
                <div key={faq.q} className={`qa-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="qa-summary"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="qi" style={{ background: bg, color: fg }}>
                      {idx + 1}
                    </span>
                    <span className="q-title">{faq.q}</span>
                    <span className="pm" aria-hidden="true" />
                  </button>

                  {isOpen && (
                    <div className="ans">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredFaqs.length === 0 && (
            <p className="qa-empty" style={{ display: 'block' }}>
              No question matches “{searchQuery}”. Try searching for “kit”, “sachet”, or an episode name!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
