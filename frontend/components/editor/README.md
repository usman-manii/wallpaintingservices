# Enterprise Rich Text Editor

A production-ready, self-contained, pluggable rich text editor component for blog authoring.

## Features

### ✅ Text Formatting
- **Bold** (Ctrl+B)
- *Italic* (Ctrl+I)
- <u>Underline</u> (Ctrl+U)
- ~~Strikethrough~~

### ✅ Structure
- Headings (H1-H6)
- Paragraphs
- Bullet lists
- Numbered lists
- Task lists / checkboxes

### ✅ Alignment
- Align left
- Align center
- Align right
- Justify

### ✅ Rich Content
- **Blockquotes** - Highlighted quotes with styling
- **Code blocks** - For code snippets
- **Inline code** - `code` formatting
- **Links** - With URL validation
- **Images** - Upload or embed URLs
- **Videos** - YouTube and other embeds
- **Tables** - Customizable rows/columns
- **Horizontal rules** - Visual separators

### ✅ Colors
- Text color picker
- Background color/highlighting
- Preset color palette

### ✅ Productivity
- **Undo/Redo** (Ctrl+Z, Ctrl+Y)
- **Word count** - Real-time tracking
- **Reading time** - Automatic calculation
- **Fullscreen mode** - Distraction-free writing
- **Keyboard shortcuts** - Fast editing
- **Auto-save support** - History tracking

## Usage

```tsx
import RichTextEditor from '@/components/editor/RichTextEditor';

function BlogPostForm() {
  const [content, setContent] = useState('');

  const handleChange = (html: string, text: string, wordCount: number) => {
    setContent(html);
    console.log(`Word count: ${wordCount}`);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // Upload to your server/CDN
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.url; // Return the uploaded image URL
  };

  return (
    <RichTextEditor
      content={content}
      onChange={handleChange}
      onImageUpload={handleImageUpload}
      placeholder="Write your blog post here..."
      minHeight="400px"
      maxHeight="800px"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | `''` | Initial HTML content |
| `onChange` | `(html: string, text: string, wordCount: number) => void` | - | Callback when content changes |
| `onImageUpload` | `(file: File) => Promise<string>` | - | Handle image upload, return URL |
| `placeholder` | `string` | `'Start writing...'` | Placeholder text |
| `minHeight` | `string` | `'300px'` | Minimum editor height |
| `maxHeight` | `string` | `'600px'` | Maximum editor height |
| `className` | `string` | `''` | Additional CSS classes |
| `readOnly` | `boolean` | `false` | Disable editing |

## Keyboard Shortcuts

- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+U` - Underline
- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo

## Styling

The editor comes with a comprehensive CSS file (`editor.css`) that includes:
- Light and dark mode support
- Responsive design
- Smooth animations
- Professional typography
- Clean dialog modals

You can customize the appearance by overriding CSS variables or classes.

## SEO Benefits

- Clean HTML output
- Semantic markup
- Proper heading hierarchy
- Alt text for images
- Structured content for better indexing

## Best Practices

1. **Images**: Always provide alt text for accessibility
2. **Headings**: Use H1 for title, H2-H6 for structure
3. **Links**: Use descriptive anchor text
4. **Content**: Aim for 3000+ words for SEO
5. **Tables**: Keep them simple and readable
6. **Code**: Use code blocks for multi-line code

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lazy loading for dialogs
- Efficient DOM manipulation
- Debounced callbacks
- Optimized for large documents (10,000+ words)

## Accessibility

- ARIA labels on all buttons
- Keyboard navigation
- Screen reader support
- High contrast mode compatible

## License

Part of the Wall Painting Services CMS project.
