import {Link as RouterLink} from 'react-router-dom';

const isExternal = (href) => /^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);

/**
 * Lets Astryx links (SideNavItem, Button href, Link...) navigate with React Router
 * for in-app paths, and fall back to a plain anchor for external URLs.
 */
export default function RouterLinkAdapter({href, to, children, ...rest}) {
  const target = href ?? to;
  if (typeof target === 'string' && !isExternal(target) && !target.startsWith('#')) {
    return (
      <RouterLink to={target} {...rest}>
        {children}
      </RouterLink>
    );
  }
  return (
    <a href={target} {...rest}>
      {children}
    </a>
  );
}
