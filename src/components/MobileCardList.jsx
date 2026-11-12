import {ChevronRight} from 'lucide-react';

/**
 * Card list shown instead of a table on phones (see .mobile-cards in styles.css).
 * Each item: {key, title, subtitle?, media?, badge?, value?, actions?, onClick, actionLabel}
 * Tapping a card calls onClick, which opens the full-detail dialog. `actions` sits outside
 * the tappable area so its buttons don't nest inside the card button.
 */
export default function MobileCardList({items, label}) {
  return (
    <ul className="mobile-cards" aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className="mobile-card-item">
          <button type="button" className="mobile-card" onClick={item.onClick} aria-label={item.actionLabel}>
            {item.media || null}
            <span className="mobile-card-main">
              <span className="mobile-card-title">{item.title}</span>
              {item.subtitle ? <span className="mobile-card-sub">{item.subtitle}</span> : null}
            </span>
            <span className="mobile-card-end">
              {item.value ? <span className="mobile-card-value">{item.value}</span> : null}
              {item.badge || null}
            </span>
            <ChevronRight size={18} aria-hidden="true" className="mobile-card-chevron" />
          </button>
          {item.actions ? <div className="mobile-card-actions">{item.actions}</div> : null}
        </li>
      ))}
    </ul>
  );
}
