// English tool copy. Keep the same keys as zh-tools.js — this file is also the fallback layer.
// The ui object is serialized into <html data-ui> so client scripts can read msg('key').
export default {
  'word-counter': {
    name: 'Word Counter',
    desc: 'Count characters, words, CJK characters, lines, paragraphs and reading time in real time.',
    short: 'Live counts for characters, words, lines and reading time',
    seoTitle: 'Word Counter — Count Characters, Words & Lines Online | ToolNest',
    seoDesc: 'Free online word counter: live character count (with and without spaces), English word count, CJK character count, lines, paragraphs, sentences, UTF-8 bytes and estimated reading time. Runs locally in your browser.',
    keywords: ['word counter', 'character count', 'count words online', '字数统计'],
    howto: { steps: ['Paste or type the text you want to measure into the input box.', 'The stat cards below update as you type — no button to press.', 'Use Copy to copy the full report, or Clear to start over.'] },
    faqs: [
      { q: 'How are Chinese and English counted differently?', a: 'For languages without spaces, the CJK character count is the meaningful figure. "English words" counts whitespace-separated tokens, which suits English and similar languages. Both are shown so you can match the requirements of any platform.' },
      { q: 'Is my text uploaded anywhere?', a: 'No. All counting happens in the current browser tab with JavaScript. Text never leaves your device and disappears when you close the page.' },
      { q: 'How is reading time estimated?', a: 'We use common averages of about 300 Chinese characters or 200 English words per minute. It is a quick estimate and varies with the reader and the difficulty of the text.' },
    ],
    ui: {
      inputLabel: 'Text to count', inputPlaceholder: 'Paste or type text here — results update as you type…', liveHint: 'Live counting; your data stays in this browser',
      chars: 'Characters', charsNoSpaces: 'Characters (no spaces)', words: 'English words', cjk: 'CJK characters', lines: 'Lines', paragraphs: 'Paragraphs', sentences: 'Sentences', bytes: 'Bytes (UTF-8)', readTime: 'Estimated reading time',
      minutes: 'min', charsUnit: 'chars', wordsUnit: 'words', linesUnit: 'lines', resultLabel: 'Statistics', copyStats: 'Copy statistics',
    },
  },

  'remove-duplicate-lines': {
    name: 'Remove Duplicate Lines',
    desc: 'Delete repeated lines, with options to ignore case, trim whitespace and sort the result.',
    short: 'Remove repeated lines; ignore case or whitespace',
    seoTitle: 'Remove Duplicate Lines — Free Online Text Deduper | ToolNest',
    seoDesc: 'Free online tool to remove duplicate lines: paste text, deduplicate line by line, optionally ignore case, trim whitespace, drop empty lines and sort the output. Shows how many lines were removed. Copy or download the result.',
    keywords: ['remove duplicate lines', 'deduplicate text', 'line deduplication', '文本去重'],
    howto: { steps: ['Paste your text into the input box, one item per line.', 'Choose whether to ignore case, ignore leading/trailing whitespace, drop empty lines or sort the result.', 'Click Process. The result appears in the output box, ready to copy or download as TXT.'] },
    faqs: [
      { q: 'Which line is kept when case is ignored?', a: 'The first occurrence is kept, with its original capitalization and whitespace. Later lines considered duplicates are removed.' },
      { q: 'Can it handle tens of thousands of lines?', a: 'Yes. Deduplication uses a Set locally in your browser and usually finishes instantly. For extremely large text (hundreds of thousands of lines), paste it in batches.' },
      { q: 'Does sorting change the original order?', a: 'By default the original order is kept. Only when you enable "Sort result" is the deduplicated list reordered alphabetically.' },
    ],
    ui: {
      inputLabel: 'Original text (one item per line)', inputPlaceholder: 'apple\nbanana\napple\norange\n\nbanana', outputLabel: 'Deduplicated result', outputPlaceholder: 'Results appear here',
      ignoreCase: 'Ignore case', trimWhitespace: 'Ignore leading/trailing whitespace', sortOutput: 'Sort result alphabetically', removeEmpty: 'Remove empty lines', keepFirst: 'Keep the first occurrence',
      removedCount: '{n} lines removed', originalCount: '{n} original lines', uniqueCount: '{n} lines kept', runLabel: 'Remove duplicates',
    },
  },

  'case-converter': {
    name: 'Case Converter',
    desc: 'Instantly switch between uppercase, lowercase, title case, camelCase, snake_case and more.',
    short: 'Upper, lower, camelCase, snake_case and more',
    seoTitle: 'Case Converter — camelCase, snake_case, Title Case | ToolNest',
    seoDesc: 'Free online case converter: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, toggle case and reversed text. Instant conversion with copy and download.',
    keywords: ['case converter', 'camelCase converter', 'snake_case converter', '大小写转换'],
    howto: { steps: ['Paste text or a variable name into the input box.', 'Click any conversion button — the output updates immediately.', 'Use Copy to take the result, or Clear to start again.'] },
    faqs: [
      { q: 'What is the difference between camelCase and PascalCase?', a: 'camelCase starts with a lowercase word and capitalizes later words (myVariable); PascalCase capitalizes every word (MyVariable) and is commonly used for class names.' },
      { q: 'What happens with Chinese text?', a: 'Case rules do not apply to Chinese characters, but spaces, hyphens and underscores are still recognized as separators, which helps turn mixed-language phrases into identifier formats.' },
      { q: 'Will my original text be changed?', a: 'No. The input stays untouched and every conversion is written only to the output box, so you can compare formats freely.' },
    ],
    ui: {
      inputLabel: 'Original text', inputPlaceholder: 'Type text or a variable name, e.g. hello world or user_name', outputLabel: 'Conversion result', outputPlaceholder: 'Click a button above to generate a result',
      upper: 'UPPERCASE', lower: 'lowercase', title: 'Title Case', sentence: 'Sentence case', camel: 'camelCase', pascal: 'PascalCase', snake: 'snake_case', kebab: 'kebab-case', toggle: 'tOGGLE cASE', reverse: 'Reverse characters',
      hint: 'Click any button to convert instantly; your input stays unchanged',
    },
  },

  'text-diff': {
    name: 'Text Diff',
    desc: 'Compare two blocks of text line by line and highlight additions, deletions and unchanged lines.',
    short: 'Line-by-line diff with added and removed lines',
    seoTitle: 'Text Diff — Compare Two Texts Online | ToolNest',
    seoDesc: 'Free online text diff tool: compare two blocks of text line by line, highlight added, removed and unchanged lines, optionally ignore case and whitespace. Uses an LCS algorithm locally in your browser; nothing is uploaded.',
    keywords: ['text diff', 'compare two texts', 'online diff tool', '文本对比'],
    howto: { steps: ['Paste the original text into "Original A" and the modified text into "Compare B".', 'Optionally enable "Ignore case" or "Ignore whitespace", then click Compare.', 'The result shows green added lines, red removed lines and grey unchanged lines, with a summary on top.'] },
    faqs: [
      { q: 'How are differences computed?', a: 'A longest common subsequence (LCS) algorithm aligns the two lists of lines and produces a minimal set of additions and deletions — the same idea used by common code diff tools.' },
      { q: 'Is it suitable for code or config files?', a: 'Yes. Line-based comparison works well for code, configuration and name lists. Enable "Ignore whitespace" when indentation changes should not count as differences.' },
      { q: 'Is my text uploaded?', a: 'No. Comparison runs entirely in your browser, so contracts, source code and other sensitive text are safe to compare.' },
    ],
    ui: {
      labelA: 'Original A', labelB: 'Compare B', placeholderA: 'Paste the original text…', placeholderB: 'Paste the modified text…',
      ignoreCase: 'Ignore case', ignoreWhitespace: 'Ignore whitespace', runLabel: 'Compare texts',
      added: 'Added', removed: 'Removed', unchanged: 'Unchanged', identical: 'Both texts are identical', diffStats: '{a} added · {r} removed · {u} unchanged', resultLabel: 'Diff result',
      addedLine: 'Added line', removedLine: 'Removed line', hint: 'Lines are aligned with a longest common subsequence algorithm, computed locally',
    },
  },

  'json-formatter': {
    name: 'JSON Formatter',
    desc: 'Beautify, minify and validate JSON, with configurable indentation and key sorting.',
    short: 'Format, minify, validate JSON and locate syntax errors',
    seoTitle: 'JSON Formatter — Beautify, Minify & Validate Online | ToolNest',
    seoDesc: 'Free online JSON formatter: pretty-print with 2/4 spaces or tabs, minify to a single line, validate syntax with clear error messages, and optionally sort object keys. Runs locally in your browser; JSON is never uploaded.',
    keywords: ['json formatter', 'json validator', 'json beautifier', 'JSON 格式化'],
    howto: { steps: ['Paste JSON into the input box (or copy it in from a file).', 'Choose an indentation style, then click Format, Minify or Validate.', 'Copy or download the result as a .json file; invalid JSON shows a specific error message.'] },
    faqs: [
      { q: 'Can I see where a syntax error is?', a: 'Yes. The tool shows the browser parser error message including a position hint, which makes stray commas, quotes or brackets easy to find.' },
      { q: 'Does it handle large JSON files?', a: 'A few megabytes is usually smooth in a modern browser. Very large files are limited by available memory, so split them if needed.' },
      { q: 'Does sorting keys change my data?', a: 'It only changes the output order of object keys, never values. JSON objects are unordered, and sorting makes side-by-side review easier.' },
    ],
    ui: {
      inputLabel: 'JSON input', inputPlaceholder: '{"name":"ToolNest","tools":20,"free":true}', outputLabel: 'Result', outputPlaceholder: 'Results appear here',
      format: 'Format', minify: 'Minify', validate: 'Validate', indent: 'Indentation', indent2: '2 spaces', indent4: '4 spaces', indentTab: 'Tab', sortKeys: 'Sort keys',
      validMsg: 'Valid JSON', invalidMsg: 'Invalid JSON syntax', errorDetail: 'Error details', hint: 'Supports objects, arrays, nested structures and Unicode',
    },
  },

  'image-compressor': {
    name: 'Image Compressor',
    desc: 'Reduce image file size locally by adjusting quality and output format, with a live before/after comparison.',
    short: 'Compress JPG / PNG / WEBP locally and compare sizes',
    seoTitle: 'Image Compressor — Reduce Image Size Online, No Upload | ToolNest',
    seoDesc: 'Free online image compressor: adjust quality and output format for JPG, PNG and WEBP, see the file size drop in real time and preview the result. Uses the browser Canvas API — images never leave your device.',
    keywords: ['image compressor', 'compress image online', 'reduce image size', '图片压缩'],
    howto: { steps: ['Choose or drop a JPG, PNG or WEBP image (up to 20 MB).', 'Drag the quality slider and pick an output format (JPEG or WEBP is best for photos).', 'Click Compress to see the size comparison and preview, then download the result.'] },
    faqs: [
      { q: 'Will compression blur my image?', a: 'JPEG and WEBP are lossy: lower quality means a smaller file but more detail loss. PNG is lossless, so changing quality barely affects its size. Start around 80% and adjust from there.' },
      { q: 'Is transparency preserved?', a: 'Choose PNG or WEBP as the output format to keep the alpha channel. When exporting to JPEG, transparent areas are filled with white.' },
      { q: 'Are images uploaded to a server?', a: 'No. The image is read through the browser File API, re-encoded with Canvas, and the download link is generated locally. No network upload happens at any point.' },
    ],
    ui: {
      selectLabel: 'Choose or drop an image', hint: 'JPG / PNG / WEBP, up to 20 MB each', quality: 'Output quality', qualityHint: 'Lower values mean smaller files and more quality loss',
      outputFormat: 'Output format', originalSize: 'Original size', outputSize: 'Compressed size', savedLabel: 'Saved', previewLabel: 'Preview', dimension: 'Dimensions',
      runLabel: 'Compress image', downloadLabel: 'Download compressed image', typeError: 'Only JPG / PNG / WEBP images are supported', sizeError: 'Image is larger than 20 MB — please choose a smaller one', readError: 'Could not read this image, please try another file',
    },
  },

  'image-resizer': {
    name: 'Image Resizer',
    desc: 'Resize images by exact pixels or common presets, with an optional aspect ratio lock.',
    short: 'Resize by pixels or presets; lock the aspect ratio',
    seoTitle: 'Image Resizer — Change Image Dimensions Online | ToolNest',
    seoDesc: 'Free online image resizer: set width and height in pixels, lock the aspect ratio, use common size presets, preview and download. Powered by the browser Canvas API, with no uploads.',
    keywords: ['image resizer', 'resize image online', 'change image dimensions', '图片尺寸调整'],
    howto: { steps: ['Choose a JPG, PNG or WEBP image — its original dimensions are shown.', 'Enter a target width and height; with "Keep aspect ratio" enabled, filling one field calculates the other.', 'Click Resize to preview, then download the image.'] },
    faqs: [
      { q: 'Does upscaling make an image sharper?', a: 'No. Upscaling only interpolates pixels; it cannot add detail that was never captured. Use the original high-resolution file whenever sharpness matters.' },
      { q: 'Can I resize several images at once?', a: 'The current version processes one image at a time to keep things simple and reliable. Batch resizing is on the roadmap.' },
      { q: 'What format is the output?', a: 'By default the original format is kept (PNG transparency included). The result area shows the actual output format and file size.' },
    ],
    ui: {
      selectLabel: 'Choose or drop an image', hint: 'JPG / PNG / WEBP, up to 20 MB each', width: 'Width (px)', height: 'Height (px)', lockRatio: 'Keep aspect ratio',
      presetLabel: 'Common presets', presetCustom: 'Custom', runLabel: 'Resize image', downloadLabel: 'Download image', sizeLabel: 'Dimensions', originalSize: 'Original size', outputSize: 'Output size', previewLabel: 'Preview',
      typeError: 'Only JPG / PNG / WEBP images are supported', sizeError: 'Image is larger than 20 MB — please choose a smaller one', invalidSize: 'Enter width and height between 1 and 20000', readError: 'Could not read this image, please try another file',
    },
  },

  'image-converter': {
    name: 'Image Converter',
    desc: 'Convert between JPG, PNG and WEBP, with adjustable quality for lossy formats.',
    short: 'Convert JPG / PNG / WEBP with quality control',
    seoTitle: 'Image Converter — JPG, PNG & WEBP Online | ToolNest',
    seoDesc: 'Free online image format converter: JPG to PNG, PNG to JPG, WEBP to JPG or PNG, with quality control and proper transparency handling. Uses the browser Canvas API; images are never uploaded.',
    keywords: ['image converter', 'jpg to png', 'png to webp', '图片格式转换'],
    howto: { steps: ['Choose the image you want to convert.', 'Pick a target format (JPG / PNG / WEBP) and adjust quality for JPG or WEBP.', 'Click Convert to preview the result and download it.'] },
    faqs: [
      { q: 'What happens to transparency when converting PNG to JPG?', a: 'JPEG has no alpha channel, so transparent areas are filled with white. Choose PNG or WEBP if you need to keep transparency.' },
      { q: 'Can everyone open WEBP files?', a: 'Modern browsers (Chrome, Edge, Firefox, Safari 14+) support WEBP. For older software or systems, convert to JPG or PNG instead.' },
      { q: 'Does conversion reduce quality?', a: 'Converting to PNG is lossless. JPG and WEBP are lossy encodings, so use a high quality value (90% or above) to keep loss minimal.' },
    ],
    ui: {
      selectLabel: 'Choose or drop an image', hint: 'JPG / PNG / WEBP, up to 20 MB each', targetFormat: 'Target format', quality: 'Quality (JPG / WEBP)',
      runLabel: 'Convert image', downloadLabel: 'Download converted image', originalSize: 'Original size', outputSize: 'Output size', previewLabel: 'Preview',
      typeError: 'Only JPG / PNG / WEBP images are supported', sizeError: 'Image is larger than 20 MB — please choose a smaller one', readError: 'Could not read this image, please try another file',
    },
  },

  'merge-pdf': {
    name: 'Merge PDF',
    desc: 'Combine several PDF files into one in the order you choose.',
    short: 'Combine multiple PDFs in your chosen order',
    seoTitle: 'Merge PDF Files Online — Free, No Upload | ToolNest',
    seoDesc: 'Free online PDF merger: select multiple PDFs, reorder them and combine them into one file, with a total page count. Powered by pdf-lib in your browser — files are never uploaded.',
    keywords: ['merge pdf', 'combine pdf files', 'join pdf online', 'PDF 合并'],
    howto: { steps: ['Click "Choose PDF files" to select several files, or add more in several rounds.', 'Reorder the list with Move up / Move down, or remove files you do not need.', 'Click "Merge PDF" — the combined file downloads automatically.'] },
    faqs: [
      { q: 'Can I merge encrypted or password-protected PDFs?', a: 'Password-protected PDFs cannot be read locally. Remove the password first. The tool never attempts to bypass PDF passwords.' },
      { q: 'Are there file size or count limits?', a: 'There is no hard count limit, but all files are loaded into browser memory. Keeping the combined size under a few dozen MB avoids slowdowns.' },
      { q: 'Are my files uploaded?', a: 'No. Merging is done in the browser with pdf-lib, and the resulting PDF is downloaded from a local Blob. Nothing is sent over the network.' },
    ],
    ui: {
      selectLabel: 'Choose PDF files', hint: 'Multiple PDF files, up to 50 MB each', addMore: 'Add more', fileList: 'File list (merged in this order)', pages: 'pages', totalPages: '{n} pages total',
      runLabel: 'Merge PDF', emptyHint: 'Add at least 2 PDF files', minFiles: 'At least 2 PDF files are required', typeError: 'Only PDF files are supported', readError: 'Could not read this PDF — it may be damaged or encrypted', sizeError: 'Each PDF must be under 50 MB',
      processing: 'Merging, please wait…', success: 'Merge complete — download started', orderHint: 'Use Move up / Move down to change the order',
    },
  },

  'split-pdf': {
    name: 'Split PDF',
    desc: 'Extract a page range from a PDF, or split every page into its own file.',
    short: 'Extract page ranges or split every page',
    seoTitle: 'Split PDF Online — Extract Pages by Page Range | ToolNest',
    seoDesc: 'Free online PDF splitter: extract a page range such as 1-3,5,8-10 into a new PDF, or split every page into a separate file downloaded as a ZIP. Processed locally in your browser.',
    keywords: ['split pdf', 'extract pdf pages', 'pdf page extractor', 'PDF 拆分'],
    howto: { steps: ['Choose a PDF file — the total page count is displayed.', 'Select "Extract a page range" and enter pages like 1-3,5,8-10, or choose "Split every page".', 'Click Split to download. The every-page mode packs all files into one ZIP.'] },
    faqs: [
      { q: 'How do I write a page range?', a: 'Single pages (3), ranges (1-5) and comma-separated combinations (1-3,5,8-10) all work. Pages start at 1; numbers beyond the last page are ignored.' },
      { q: 'Splitting every page creates many files — how do I download them?', a: 'The tool bundles all generated PDFs into a single ZIP file. Download once and extract it locally.' },
      { q: 'Is my original PDF modified?', a: 'No. The tool only reads the original and generates new PDF files; the source file stays untouched.' },
    ],
    ui: {
      selectLabel: 'Choose a PDF file', hint: 'Choose one PDF file, up to 50 MB', modeRange: 'Extract a page range', modeEach: 'Split every page into a separate file', rangeLabel: 'Page range', rangePlaceholder: 'e.g. 1-3,5,8-10',
      runLabel: 'Split PDF', pageCount: 'This document has {n} pages', invalidRange: 'Invalid page range — use a format like 1-3,5', typeError: 'Only PDF files are supported', readError: 'Could not read this PDF — it may be damaged or encrypted',
      sizeError: 'PDF must be under 50 MB', emptyHint: 'Please choose a PDF file first', processing: 'Splitting, please wait…', success: 'Split complete — download started', rangeHint: 'Pages start at 1; ranges and comma-separated values are supported',
    },
  },

  'image-to-pdf': {
    name: 'Image to PDF',
    desc: 'Combine several images into one PDF with configurable page size and orientation.',
    short: 'Combine images into a PDF with page size options',
    seoTitle: 'Image to PDF — Combine Images into One PDF | ToolNest',
    seoDesc: 'Free online image to PDF converter: select multiple JPG / PNG / WEBP images and lay them out proportionally on A4, Letter or image-sized pages, with orientation and margin control. Runs locally; images are not uploaded.',
    keywords: ['image to pdf', 'jpg to pdf', 'combine images into pdf', '图片转 PDF'],
    howto: { steps: ['Choose one or more images — the list shows your selection order, and you can add more.', 'Set the page size (A4 / Letter / Fit image), orientation and margin.', 'Click "Generate PDF" to download the combined PDF.'] },
    faqs: [
      { q: 'Will my images be stretched?', a: 'No. Images are scaled proportionally and centered. With "Fit image" every page matches the dimensions of its image.' },
      { q: 'Are transparent PNGs supported?', a: 'They can be read, but PDF pages have a white background, so transparent areas appear white.' },
      { q: 'Can I change the image order?', a: 'Files are added in the order you select them. To change it, reselect the images or name them in order before choosing.' },
    ],
    ui: {
      selectLabel: 'Choose images (multiple allowed)', hint: 'JPG / PNG / WEBP, up to 20 MB each', addMore: 'Add more', pageSize: 'Page size', a4: 'A4', letter: 'Letter', fitImage: 'Fit image',
      orientation: 'Orientation', portrait: 'Portrait', landscape: 'Landscape', margin: 'Margin (pt)', runLabel: 'Generate PDF',
      typeError: 'Only JPG / PNG / WEBP images are supported', sizeError: 'Each image must be under 20 MB', emptyHint: 'Please choose at least one image', processing: 'Generating PDF, please wait…', success: 'PDF generated — download started', orderHint: 'Images follow your selection order',
    },
  },

  'excel-to-csv': {
    name: 'Excel to CSV',
    desc: 'Read xlsx / xls worksheets, choose a delimiter and export a CSV file.',
    short: 'Convert xlsx / xls to CSV with sheet selection',
    seoTitle: 'Excel to CSV — Convert xlsx / xls Online | ToolNest',
    seoDesc: 'Free online Excel to CSV converter: read .xlsx / .xls files, switch worksheets, choose a delimiter, add a UTF-8 BOM for Excel compatibility, preview and download CSV. Parsed locally with SheetJS; files are never uploaded.',
    keywords: ['excel to csv', 'xlsx to csv', 'spreadsheet converter', 'Excel 转 CSV'],
    howto: { steps: ['Choose a .xlsx or .xls file — all worksheets are listed.', 'Pick the worksheet to export, a delimiter, and whether to add a UTF-8 BOM.', 'Check the 10-row preview, then click "Download CSV".'] },
    faqs: [
      { q: 'Excel shows garbled Chinese characters in my CSV. What can I do?', a: 'Enable "Add UTF-8 BOM" and export again. The BOM helps Excel recognize UTF-8 encoding correctly.' },
      { q: 'Are formulas and cell formatting kept?', a: 'CSV is plain text: it keeps calculated values and text only. Formulas, colors and fonts are not preserved.' },
      { q: 'How do I export multiple worksheets?', a: 'One worksheet per export. Switch to another sheet and click Download again to export them separately.' },
    ],
    ui: {
      selectLabel: 'Choose an Excel file (.xlsx / .xls)', hint: '.xlsx / .xls files up to 20 MB', sheetLabel: 'Worksheet', delimiter: 'CSV delimiter', comma: 'Comma ,', semicolon: 'Semicolon ;', tab: 'Tab', pipe: 'Pipe |',
      bomLabel: 'Add UTF-8 BOM (Excel compatibility)', previewLabel: 'Preview (first 10 rows)', runLabel: 'Generate CSV', downloadLabel: 'Download CSV', rowCount: '{n} rows', columnCount: '{n} columns',
      typeError: 'Only .xlsx / .xls files are supported', sizeError: 'File must be under 20 MB', emptyHint: 'Please choose an Excel file first', readError: 'Could not parse this spreadsheet — the file may be damaged', encodingHint: 'Exported as UTF-8 plain text',
    },
  },

  'percentage-calculator': {
    name: 'Percentage Calculator',
    desc: 'Four everyday percentage scenarios: find a percentage, a ratio, an increase and a change rate.',
    short: 'Four percentage scenarios with the working shown',
    seoTitle: 'Percentage Calculator — Percent, Increase & Change | ToolNest',
    seoDesc: 'Free online percentage calculator: find Y% of X, calculate what percent X is of Y, add or subtract a percentage, and compute the percentage change between two values. Shows the full calculation, with instant results.',
    keywords: ['percentage calculator', 'percent change calculator', 'calculate percentage', '百分比计算器'],
    howto: { steps: ['Choose a calculation mode, for example "What is Y% of X?".', 'Enter the values shown — results update as you type.', 'Check the calculation steps below the result to verify or reuse the formula.'] },
    faqs: [
      { q: 'Is profit margin the same as markup?', a: 'No. This tool works with plain numeric percentages. For margin and markup, use the Profit Margin Calculator — they divide by different bases (selling price vs cost).' },
      { q: 'Are decimals and negative numbers supported?', a: 'Decimals are supported. Negative numbers are mathematically valid in ratio and change calculations but rarely meaningful in everyday use, so judge them in context.' },
      { q: 'How many decimal places are shown?', a: 'Results keep up to 4 decimal places with trailing zeros removed, and the full calculation is shown so you can round as needed.' },
    ],
    ui: {
      modeHint: 'Choose a calculation mode', mode1: 'What is Y% of X?', mode2: 'X is what percent of Y?', mode3: 'What is X after increasing or decreasing by Y%?', mode4: 'What is the percentage change from X to Y?',
      xLabel: 'Value X', yLabel: 'Value Y', percentLabel: 'Percentage Y (%)', direction: 'Direction', increase: 'Increase', decrease: 'Decrease',
      resultLabel: 'Result', formulaLabel: 'Working', runLabel: 'Calculate', hint: 'Results update instantly and show the full working', invalidNumber: 'Please enter a valid number', oldLabel: 'Original value X', newLabel: 'New value Y',
    },
  },

  'profit-margin-calculator': {
    name: 'Profit Margin Calculator',
    desc: 'Compute gross margin, markup, profit and revenue from cost and selling price.',
    short: 'Margin, markup and profit from cost and price',
    seoTitle: 'Profit Margin Calculator — Margin & Markup Online | ToolNest',
    seoDesc: 'Free online profit margin calculator: enter cost, selling price and quantity to get gross profit, margin, markup, revenue and total cost, including optional extra costs like freight. Instant results for pricing and quoting.',
    keywords: ['profit margin calculator', 'gross margin', 'markup calculator', '利润率计算器'],
    howto: { steps: ['Enter the unit cost and unit selling price; quantity defaults to 1.', 'Add any extra costs such as freight or packaging in "Extra costs".', 'The result area shows gross profit, margin, markup, revenue and total cost in real time.'] },
    faqs: [
      { q: 'What is the difference between margin and markup?', a: 'Margin = profit / selling price; markup = profit / cost. For a cost of 80 and a price of 100, margin is 20% while markup is 25%.' },
      { q: 'Can margin exceed 100%?', a: 'No. With a normal price above cost, margin sits between 0 and 100%. A price below cost gives a negative margin, meaning a loss.' },
      { q: 'How are extra costs handled?', a: 'Extra costs are added to total cost as a lump sum, which reduces gross profit and margin. Use it for freight, packaging or platform fees.' },
    ],
    ui: {
      costLabel: 'Unit cost', priceLabel: 'Unit selling price', quantityLabel: 'Quantity', extraCostLabel: 'Extra costs (freight, packaging, etc.)',
      marginLabel: 'Gross margin', markupLabel: 'Markup', profitLabel: 'Gross profit', unitProfitLabel: 'Unit profit', revenueLabel: 'Revenue', totalCostLabel: 'Total cost',
      resultLabel: 'Results', runLabel: 'Calculate', hint: 'Results update whenever cost, price or quantity changes', invalidNumber: 'Please enter valid non-negative numbers',
      note: 'Margin uses selling price as the base; markup uses cost', lossNote: 'Selling price is below total cost — this is a loss',
    },
  },

  'unit-converter': {
    name: 'Unit Converter',
    desc: 'Convert length, weight, temperature, area, volume, speed, data and time units.',
    short: '8 unit categories including length, weight and temperature',
    seoTitle: 'Unit Converter — Length, Weight, Temperature & More | ToolNest',
    seoDesc: 'Free online unit converter for length, weight, temperature, area, volume, speed, digital storage and time. Pick units, enter a value, get an instant result, and swap units with one click. Calculated locally in your browser.',
    keywords: ['unit converter', 'length converter', 'weight converter', 'temperature converter', '单位换算'],
    howto: { steps: ['Pick a conversion category, for example Length or Weight.', 'Choose the source and target units, then enter a value.', 'The result appears instantly; click Swap to convert in the opposite direction.'] },
    faqs: [
      { q: 'Why is temperature not a simple multiplication?', a: 'Celsius, Fahrenheit and Kelvin have different zero points, so they need dedicated formulas. Other categories use fixed conversion factors, and both cases are handled separately.' },
      { q: 'Is data storage converted with 1000 or 1024?', a: 'This tool uses SI decimal units (1 KB = 1000 B), matching drive manufacturers. Operating systems often display 1024-based units, so the numbers can differ.' },
      { q: 'How precise are the results?', a: 'Calculations use double-precision floats and display up to 10 significant digits with trailing zeros removed; very small numbers use scientific notation.' },
    ],
    ui: {
      categoryLabel: 'Category', fromLabel: 'From', toLabel: 'To', valueLabel: 'Value', resultLabel: 'Result', swapLabel: 'Swap units',
      hint: 'Choose a category and units, then enter a value', invalidNumber: 'Please enter a valid number', formulaLabel: 'Conversion',
    },
  },

  'date-calculator': {
    name: 'Date Calculator',
    desc: 'Find the interval between two dates, or add and subtract days from a date.',
    short: 'Date intervals, weekdays and date arithmetic',
    seoTitle: 'Date Calculator — Days Between Dates & Add Days | ToolNest',
    seoDesc: 'Free online date calculator: find the number of days, weeks, months, years and weekdays between two dates, or add/subtract days from a date to get the resulting date and weekday. Instant results.',
    keywords: ['date calculator', 'days between dates', 'add days to date', '日期计算器'],
    howto: { steps: ['Choose "Difference between two dates" or "Add or subtract days".', 'Fill in the start/end dates, or a base date and a number of days.', 'The result area shows the difference, weekday count, or the calculated date and weekday.'] },
    faqs: [
      { q: 'Are public holidays included in weekdays?', a: 'No. "Weekdays" excludes Saturdays and Sundays only. It does not account for public holidays or adjusted workdays, so check a calendar for formal scheduling.' },
      { q: 'Does the day difference include the end date?', a: 'By default it does not — it is the pure time difference. Enable "Include end date" to add 1 day, which suits inclusive rental or project periods.' },
      { q: 'How are months and years estimated?', a: 'We use averages of 30.44 days per month and 365.25 days per year for a quick reference. For an exact "N months later", use the add/subtract mode with days.' },
    ],
    ui: {
      modeDiff: 'Difference between two dates', modeAdd: 'Add or subtract days from a date', modeHint: 'Choose a mode',
      startDate: 'Start date', endDate: 'End date', baseDate: 'Base date', days: 'Number of days', add: 'Add', subtract: 'Subtract', includeEnd: 'Include the end date',
      resultLabel: 'Results', daysDiff: 'Days between', weeks: 'Approx. weeks', months: 'Approx. months', years: 'Approx. years', weekdays: 'Weekdays (excl. weekends)', weekendDays: 'Weekend days',
      resultDate: 'Resulting date', weekday: 'Weekday', runLabel: 'Calculate', hint: 'Results update whenever a date changes', invalidDate: 'Please choose complete, valid dates', negativeHint: 'The end date is before the start date, so the result is negative',
      daysUnit: 'days', weeksUnit: 'weeks', monthsUnit: 'months', yearsUnit: 'years',
    },
  },

  'url-encoder-decoder': {
    name: 'URL Encoder / Decoder',
    desc: 'Percent-encode and decode URLs or parameters, with correct handling of Chinese text.',
    short: 'Percent-encode / decode URLs with Unicode support',
    seoTitle: 'URL Encoder & Decoder — Percent Encoding Online | ToolNest',
    seoDesc: 'Free online URL encoder and decoder: encodeURIComponent encoding and decoding for URLs and query parameters, with correct handling of Chinese, spaces and special characters. Switch to whole-URL mode when needed. Runs locally.',
    keywords: ['url encoder decoder', 'percent encoding', 'encode uri component', 'URL 编码解码'],
    howto: { steps: ['Paste a URL or a query parameter into the input box.', 'Click Encode or Decode; component mode is on by default and can be switched off.', 'Copy the result with one click — failed decoding shows a clear error.'] },
    faqs: [
      { q: 'What is the difference between component mode and whole-URL mode?', a: 'Component mode (encodeURIComponent) escapes reserved characters such as : / ? & = and suits query parameter values. Turning it off uses encodeURI, which keeps URL structure characters and suits a complete address.' },
      { q: 'Why must Chinese characters be encoded?', a: 'The URL standard allows ASCII only. Chinese characters and emoji must be converted to UTF-8 bytes and then percent-encoded, or some servers and browsers will parse them incorrectly.' },
      { q: 'Is a space encoded as + or %20?', a: 'This tool follows the standard and outputs %20. The + form belongs to application/x-www-form-urlencoded form submissions; the two are not equivalent.' },
    ],
    ui: {
      inputLabel: 'Input', inputPlaceholder: 'Paste a URL or parameter, e.g. https://example.com/search?q=中文 tool', outputLabel: 'Result', outputPlaceholder: 'Encoded or decoded text appears here',
      encode: 'Encode', decode: 'Decode', componentOnly: 'Component mode (encodeURIComponent / decodeURIComponent)', hint: 'Component mode suits parameter values; turn it off for a whole URL',
      decodeError: 'Decoding failed: input is not a valid percent-encoded string', emptyHint: 'Please enter something first',
    },
  },

  'base64-encoder-decoder': {
    name: 'Base64 Encoder / Decoder',
    desc: 'Encode and decode Base64 for text and files, with full Chinese and Unicode support.',
    short: 'Base64 for text and files with proper UTF-8 handling',
    seoTitle: 'Base64 Encoder & Decoder — Text & Files Online | ToolNest',
    seoDesc: 'Free online Base64 encoder and decoder: generate Base64 and Data URLs from text or any file, decode back to text or a downloadable file, with correct UTF-8 handling for Chinese and emoji. Runs locally; files are not uploaded.',
    keywords: ['base64 encoder decoder', 'base64 encode', 'image to base64', 'Base64 编码解码'],
    howto: { steps: ['Choose Text mode and enter text, or File mode and pick a file.', 'Click Encode to produce Base64 (File mode also creates a Data URL), or paste Base64 and click Decode.', 'Copy text results, or in File mode download the decoded original file.'] },
    faqs: [
      { q: 'Why does btoa throw an error on Chinese text?', a: 'btoa only accepts Latin-1 characters. This tool encodes UTF-8 bytes via TextEncoder and restores them with TextDecoder, so Chinese and emoji round-trip correctly.' },
      { q: 'Is Base64 encryption?', a: 'No. Base64 is only a binary-to-text encoding that anyone can decode. Never use it to protect sensitive information.' },
      { q: 'Is there a file size limit?', a: 'We recommend files under 10 MB. Base64 grows data by about 33%, and very large files may slow the browser down.' },
    ],
    ui: {
      inputLabel: 'Input', inputPlaceholder: 'Type text to encode, or paste a Base64 string to decode', outputLabel: 'Result', outputPlaceholder: 'Results appear here',
      encode: 'Encode', decode: 'Decode', modeText: 'Text mode', modeFile: 'File mode', fileLabel: 'Choose a file', fileHint: 'Any file type, recommended under 10 MB',
      dataUrlLabel: 'Data URL', hint: 'UTF-8 byte encoding — Chinese and emoji work correctly', decodeError: 'Decoding failed: input is not a valid Base64 string',
      sizeError: 'File is larger than 10 MB — please choose a smaller one', emptyHint: 'Please enter text or choose a file', downloadLabel: 'Download decoded file', utf8Label: 'UTF-8 text',
    },
  },

  'color-converter': {
    name: 'Color Converter',
    desc: 'Convert between HEX, RGB and HSL, with a color picker and palette references.',
    short: 'HEX / RGB / HSL conversion, picker and variants',
    seoTitle: 'Color Converter — HEX, RGB & HSL Online | ToolNest',
    seoDesc: 'Free online color converter: enter HEX, RGB or HSL and get the other formats instantly, with a color picker, live preview, lighter/darker variants and a complementary color. Click any value to copy the CSS color.',
    keywords: ['color converter', 'hex to rgb', 'rgb to hsl', '颜色转换'],
    howto: { steps: ['Enter a value in any field (HEX / RGB / HSL), or use the color picker.', 'The other formats update automatically and the preview shows the color.', 'Use Lighter / Darker / Complementary for palette ideas, and click a value to copy it.'] },
    faqs: [
      { q: 'Are shorthand HEX values supported?', a: 'Yes — both 3-digit shorthand like #fff and full 6-digit values. 8-digit HEX with alpha uses its RGB portion.' },
      { q: 'Can I paste CSS-style RGB?', a: 'Yes. Plain values such as 255, 99, 71 and the rgb(255, 99, 71) form are both accepted, with commas or spaces as separators.' },
      { q: 'How is the complementary color calculated?', a: 'The hue is rotated by 180 degrees in HSL space while saturation and lightness stay the same — a quick way to generate a contrasting color.' },
    ],
    ui: {
      hexLabel: 'HEX', rgbLabel: 'RGB', hslLabel: 'HSL', pickerLabel: 'Color picker', previewLabel: 'Color preview',
      invalidMsg: 'Invalid color value, please check your input', lighten: 'Lighten 10%', darken: 'Darken 10%', complementary: 'Complementary',
      hint: 'Editing any field syncs the others', cssLabel: 'CSS value', copyHint: 'Click a value to copy it',
    },
  },

  'qr-code-generator': {
    name: 'QR Code Generator',
    desc: 'Turn a URL or text into a QR code with custom size, error correction and colors.',
    short: 'Generate QR codes, export PNG or SVG',
    seoTitle: 'QR Code Generator — Custom Colors & Error Correction | ToolNest',
    seoDesc: 'Free online QR code generator: encode a URL or any text, customize size, error correction level, foreground and background colors and quiet zone, then download PNG or SVG. Content is encoded locally, never uploaded.',
    keywords: ['qr code generator', 'create qr code', 'url to qr code', '二维码生成器'],
    howto: { steps: ['Enter a URL or any text you want to encode.', 'Set the size, error correction level, colors and quiet zone as needed.', 'Click Generate to see the preview, then download a PNG or SVG.'] },
    faqs: [
      { q: 'Which error correction level should I pick?', a: 'Higher levels survive dirt or obstruction better but make the pattern denser. Level M is fine for on-screen use; choose Q or H for packaging or when adding a logo.' },
      { q: 'Do QR codes expire?', a: 'No. The content is encoded directly into the pattern, with no short-link service involved. As long as the content itself is valid, the code keeps working.' },
      { q: 'Is my content uploaded?', a: 'No. The QR code is generated locally with the qrcode library, and PNG/SVG files are exported by your browser — nothing passes through a server.' },
    ],
    ui: {
      contentLabel: 'QR code content', contentPlaceholder: 'https://example.com or any text', sizeLabel: 'Size (px)', levelLabel: 'Error correction',
      levelL: 'L (~7%)', levelM: 'M (~15%)', levelQ: 'Q (~25%)', levelH: 'H (~30%)',
      fgLabel: 'Foreground', bgLabel: 'Background', marginLabel: 'Quiet zone (modules)', runLabel: 'Generate QR code', downloadPng: 'Download PNG', downloadSvg: 'Download SVG',
      emptyHint: 'Please enter content to encode', tooLong: 'Content is too long — please shorten it', hint: 'Keep strong contrast between foreground and background for reliable scanning', previewLabel: 'QR preview', contrastHint: 'Low color contrast may hurt scannability',
    },
  },
};
