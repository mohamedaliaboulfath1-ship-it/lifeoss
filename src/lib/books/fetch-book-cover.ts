/** Client-side book cover lookup — OpenLibrary + Google Books (no API key). */

export async function fetchBookCoverUrl(
  title: string,
  author?: string
): Promise<string | null> {
  const t = title.trim();
  if (!t) return null;

  try {
    const olQuery = encodeURIComponent(`${t} ${author?.trim() ?? ""}`.trim());
    const olRes = await fetch(
      `https://openlibrary.org/search.json?q=${olQuery}&limit=1&fields=cover_i,isbn,title`
    );
    if (olRes.ok) {
      const olData = (await olRes.json()) as {
        docs?: Array<{ cover_i?: number; isbn?: string[] }>;
      };
      const doc = olData.docs?.[0];
      if (doc?.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
      const isbn = doc?.isbn?.[0];
      if (isbn) {
        return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const parts = [
      `intitle:${encodeURIComponent(t)}`,
      author?.trim() ? `inauthor:${encodeURIComponent(author.trim())}` : "",
    ]
      .filter(Boolean)
      .join("+");
    const gRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${parts}&maxResults=1`
    );
    if (gRes.ok) {
      const gData = (await gRes.json()) as {
        items?: Array<{
          volumeInfo?: {
            imageLinks?: { thumbnail?: string; smallThumbnail?: string };
          };
        }>;
      };
      const links = gData.items?.[0]?.volumeInfo?.imageLinks;
      const thumb = links?.thumbnail ?? links?.smallThumbnail;
      if (thumb) {
        return thumb.replace("http://", "https://").replace("&zoom=1", "").replace("zoom=1", "zoom=0");
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}
