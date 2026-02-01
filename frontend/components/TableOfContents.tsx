'use client';

type TocItem = { id: string; text: string; level: number };

export default function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items || items.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sticky top-24 max-h-[80vh] overflow-auto">
      <h4 className="font-semibold text-foreground mb-3">On this page</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.id} className={`pl-${(item.level - 2) * 4}`}>
            <button
              onClick={() => handleClick(item.id)}
              className="hover:text-primary transition-colors text-left"
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
