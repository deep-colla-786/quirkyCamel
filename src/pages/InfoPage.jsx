import React from 'react';
import PropTypes from 'prop-types';
import { Mail, Phone, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { POLICIES } from '../data/policies';
import { BUSINESS } from '../data/business';
import { INFO_PAGES, paths } from '../lib/routes';

function Paragraph({ item }) {
  if (typeof item === 'string') return <p>{item}</p>;
  return (
    <ul>
      {item.list.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

Paragraph.propTypes = {
  item: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ list: PropTypes.arrayOf(PropTypes.string).isRequired })]).isRequired
};

// The business details customers need to reach us (shown on the Contact page).
function ContactCard() {
  const rows = [
    [Mail, 'Email', BUSINESS.email && <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>],
    [Phone, 'Phone', BUSINESS.phone && <a href={`tel:${BUSINESS.phone.replaceAll(' ', '')}`}>{BUSINESS.phone}</a>],
    [Clock, 'Hours', BUSINESS.hours],
    [MapPin, 'Registered address', BUSINESS.address && [BUSINESS.legalName, BUSINESS.address].filter(Boolean).join(', ')],
    [
      ShieldCheck,
      'Grievance officer',
      BUSINESS.grievanceOfficer.email && (
        <>
          {BUSINESS.grievanceOfficer.name ? `${BUSINESS.grievanceOfficer.name} · ` : ''}
          <a href={`mailto:${BUSINESS.grievanceOfficer.email}`}>{BUSINESS.grievanceOfficer.email}</a>
        </>
      )
    ],
    [null, 'GSTIN', BUSINESS.gstin]
  ].filter(([, , value]) => value);
  return (
    <section className="account-card info-contact">
      <h2>Get in touch</h2>
      <ul className="account-facts">
        {rows.map(([Icon, label, value]) => (
          <li key={label}>
            {Icon && <Icon size={17} />}
            <span>
              <small>{label}</small>
              {value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// /shipping, /refunds, /privacy, /terms and /contact.
export default function InfoPage({ page }) {
  const policy = POLICIES[page];
  return (
    <div className="account-page info-page">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href={paths.home}>Home</a>
          <span>/</span>
          <span aria-current="page">{policy.title}</span>
        </nav>
        <div className="account-head">
          <div>
            <span className="pd-eyebrow">{page === 'contact' ? 'We’re here to help' : `Last updated ${policy.updated}`}</span>
            <h1>{policy.title}</h1>
          </div>
        </div>
        <div className="info-layout">
          <article className="account-card info-body">
            {page === 'contact' && <ContactCard />}
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((item) => (
                  <Paragraph key={typeof item === 'string' ? item : item.list[0]} item={item} />
                ))}
              </section>
            ))}
          </article>
          <nav className="account-card info-nav" aria-label="Store information">
            <h2>Store information</h2>
            <ul>
              {INFO_PAGES.map((id) => (
                <li key={id}>
                  <a href={paths[id]} aria-current={id === page ? 'page' : undefined}>
                    {POLICIES[id].title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

InfoPage.propTypes = { page: PropTypes.oneOf(INFO_PAGES).isRequired };
