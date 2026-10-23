import React from 'react';
import PropTypes from 'prop-types';
import { Star } from 'lucide-react';

export default function Reviews({ reviews }) {
  return (
    <section className="pd-reviews" aria-labelledby="reviews-h">
      <h2 id="reviews-h">Ratings & reviews</h2>
      {reviews.length ? (
        <div className="pd-review-list">
          {reviews.map((r) => (
            <article key={r.id} className="pd-review">
              <div className="pd-stars" aria-label={`${r.rating} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={15} fill={i < r.rating ? 'currentColor' : 'none'} />
                ))}
              </div>
              <b>{r.title}</b>
              <p>{r.body}</p>
              <small>{r.author}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="pd-review-empty">
          <span className="icon" />
          <div>
            <b>No reviews yet</b>
            <p>Reviews open once the first kits reach their camels. Yours could be the first.</p>
          </div>
        </div>
      )}
    </section>
  );
}

Reviews.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      rating: PropTypes.number,
      title: PropTypes.string,
      body: PropTypes.string,
      author: PropTypes.string
    })
  ).isRequired
};
