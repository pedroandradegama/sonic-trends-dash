import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Normalizes scientific URLs:
 * - "10.xxxx/xxxxx" or "doi:10.xxxx/xxxxx" → https://doi.org/...
 * - Pure PMID (digits only, e.g. "41536874") → https://pubmed.ncbi.nlm.nih.gov/41536874/
 * - Already full URLs → returned as-is
 */
export function normalizeScientificUrl(href: string): string {
  if (!href) return href;

  const trimmed = href.trim();

  // doi:10.xxxx/xxxx or plain 10.xxxx/xxxx
  const doiMatch = trimmed.match(/^(?:doi:|https?:\/\/doi\.org\/)?(10\.\d{4,}\/\S+)$/i);
  if (doiMatch) {
    return `https://doi.org/${doiMatch[1]}`;
  }

  // Pure PMID — only digits
  if (/^\d{5,9}$/.test(trimmed)) {
    return `https://pubmed.ncbi.nlm.nih.gov/${trimmed}/`;
  }

  // Already a full URL
  return trimmed;
}

function isExternal(href: string): boolean {
  try {
    const url = new URL(href, window.location.href);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  showIcon?: boolean;
  iconClassName?: string;
}

/**
 * A drop-in <a> replacement that:
 * 1. Normalizes DOI/PMID identifiers to full URLs.
 * 2. Always opens external links in a new tab via window.open,
 *    bypassing iframe sandbox restrictions (ERR_BLOCKED_BY_RESPONSE).
 */
export function ExternalLink({
  href,
  children,
  className,
  showIcon = false,
  iconClassName,
  onClick,
  ...rest
}: ExternalLinkProps) {
  const normalizedHref = normalizeScientificUrl(href);
  const external = isExternal(normalizedHref);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (external) {
      e.preventDefault();
      const opened = window.open(normalizedHref, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = normalizedHref;
      }
    }
    onClick?.(e);
  };

  return (
    <a
      href={normalizedHref}
      target={external ? '_blank' : rest.target}
      rel={external ? 'noopener noreferrer' : rest.rel}
      onClick={handleClick}
      className={cn('inline-flex items-center gap-1', className)}
      {...rest}
    >
      {children}
      {showIcon && <ExternalLinkIcon className={cn('h-3 w-3', iconClassName)} />}
    </a>
  );
}

export default ExternalLink;
