// Example usage of the new Page Builder widgets

import { HeadingWidget, TextWidget, ImageWidget } from '@/components/widgets';

export default function PageBuilderExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Page Builder Widgets Demo</h1>

      {/* Heading Widget - Editable */}
      <div>
        <h2 className="text-xl font-semibold mb-4">1. Heading Widget (Editable)</h2>
        <HeadingWidget
          content="Welcome to Our Website"
          tag="h1"
          font="default"
          color="#1e293b"
          alignment="center"
          editable={true}
          onChange={(data) => console.log('Heading changed:', data)}
        />
      </div>

      {/* Heading Widget - Display Mode */}
      <div>
        <h2 className="text-xl font-semibold mb-4">2. Heading Widget (Display Mode)</h2>
        <HeadingWidget
          content="This is a Display Heading"
          tag="h2"
          font="Georgia, serif"
          color="#059669"
          alignment="left"
          editable={false}
        />
      </div>

      {/* Text Widget - Editable */}
      <div>
        <h2 className="text-xl font-semibold mb-4">3. Text Widget (Editable)</h2>
        <TextWidget
          content="<p>This is an editable text widget with <strong>bold</strong>, <em>italic</em>, and <u>underline</u> support.</p>"
          editable={true}
          onChange={(content) => console.log('Text changed:', content)}
        />
      </div>

      {/* Text Widget - Display Mode */}
      <div>
        <h2 className="text-xl font-semibold mb-4">4. Text Widget (Display Mode)</h2>
        <TextWidget
          content="<p>This text is in display mode. It supports:</p><ul><li>Bullet lists</li><li><strong>Bold text</strong></li><li><em>Italic text</em></li></ul>"
          editable={false}
        />
      </div>

      {/* Image Widget - Editable */}
      <div>
        <h2 className="text-xl font-semibold mb-4">5. Image Widget (Editable)</h2>
        <ImageWidget
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
          alt="Beautiful landscape"
          width="100%"
          height="auto"
          alignment="center"
          caption="A stunning landscape photograph"
          editable={true}
          onChange={(data) => console.log('Image changed:', data)}
        />
      </div>

      {/* Image Widget - Display Mode */}
      <div>
        <h2 className="text-xl font-semibold mb-4">6. Image Widget (Display Mode)</h2>
        <ImageWidget
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
          alt="Landscape"
          width="600px"
          height="auto"
          alignment="center"
          caption="Display mode image"
          editable={false}
        />
      </div>

      {/* Usage Instructions */}
      <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How to Use These Widgets</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-lg mb-2">1. Heading Widget</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Choose heading tag (H1-H6)</li>
              <li>Select font family (defaults to site font)</li>
              <li>Customize color and alignment</li>
              <li>Optional custom font size</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">2. Text Widget</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Rich text editor with formatting toolbar</li>
              <li>Bold, Italic, Underline, Strikethrough</li>
              <li>Ordered and Unordered lists</li>
              <li>Text alignment (Left, Center, Right)</li>
              <li>Font size selection</li>
              <li>Text and background color pickers</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">3. Image Widget</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Image URL input</li>
              <li>Alt text for SEO</li>
              <li>Width and height customization</li>
              <li>Alignment options</li>
              <li>Optional caption</li>
              <li>Live preview</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold mb-2">Import Statement:</h4>
          <code className="text-sm">
            import {'{'} HeadingWidget, TextWidget, ImageWidget {'}'} from '@/components/widgets';
          </code>
        </div>
      </div>
    </div>
  );
}
