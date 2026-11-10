import { getDocument, listDocuments } from '../../lib/documents';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return listDocuments().map((document) => ({ document }));
}

export async function GET(_request, { params }) {
  const { document } = await params;
  const markup = getDocument(document);

  return new Response(markup ?? getDocument('404'), {
    status: markup && document !== '404' ? 200 : 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
