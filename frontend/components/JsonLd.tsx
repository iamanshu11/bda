/**
 * Injects a JSON-LD structured-data script.
 * Server component — safe to render in layouts/pages for SEO.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Data is developer-controlled (not user input), so this is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
