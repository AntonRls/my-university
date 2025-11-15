import createDOMPurify from 'dompurify';

type DomPurifyInstance = ReturnType<typeof createDOMPurify>;

let purifier: DomPurifyInstance | null = null;

function getPurifier(): DomPurifyInstance | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!purifier) {
    purifier = createDOMPurify(window);
  }

  return purifier;
}

export function sanitizeHtml(content: string | null | undefined): string {
  if (!content) {
    return '';
  }

  const purifierInstance = getPurifier();

  if (!purifierInstance) {
    return content;
  }

  return purifierInstance.sanitize(content, {
    USE_PROFILES: { html: true },
  });
}

export function extractPlainText(content: string | null | undefined): string {
  if (!content) {
    return '';
  }

  const sanitized = sanitizeHtml(content)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '</p>\n');

  return sanitized
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasRichTextContent(content: string | null | undefined): boolean {
  return extractPlainText(content).length > 0;
}

