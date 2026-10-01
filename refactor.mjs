import fs from 'fs';
import path from 'path';

// Define directories to process
const PAGES_DIR = path.join(process.cwd(), 'src', 'pages');
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const STYLES_DIR = path.join(process.cwd(), 'src', 'styles');
const LAYOUTS_DIR = path.join(process.cwd(), 'src', 'layouts');

// Global CSS to add
const GLOBAL_CSS_ADDITION = `
@layer components {
  /* Typography System based on Homepage */
  .text-hero-title {
    font-size: clamp(1.6rem, 2.8vw, 2.2rem) !important;
    font-weight: 800 !important;
    line-height: 1.25 !important;
    letter-spacing: -0.015em !important;
  }
  .text-hero-p {
    font-size: 15.5px !important;
    line-height: 1.8 !important;
  }
  .text-hero-label {
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0.14em !important;
    text-transform: uppercase !important;
  }
  .text-section-title {
    font-size: clamp(1.4rem, 2.2vw, 1.85rem) !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
    letter-spacing: -0.01em !important;
  }
  .text-section-title-emphasis {
    font-size: clamp(1.5rem, 2.8vw, 2.1rem) !important;
    font-weight: 800 !important;
    line-height: 1.2 !important;
  }
  .text-body-lead {
    font-size: 15.5px !important;
    line-height: 1.8 !important;
  }
  .text-btn {
    font-size: 14px !important;
    font-weight: 700 !important;
  }
  .text-label {
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0.14em !important;
    text-transform: uppercase !important;
  }
}
`;

function processFile(filePath) {
  // skip index.astro to preserve master reference
  if (filePath.endsWith('pages\\index.astro') || filePath.endsWith('pages/index.astro')) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove font imports
  content = content.replace(/@import\s+url\('https:\/\/fonts\.googleapis\.com[^']+'\);\s*/g, '');

  // 2. Remove font-family overrides
  content = content.replace(/font-family:\s*[^;}]+;?/g, '');
  content = content.replace(/class="([^"]*)\b(font-serif|font-mono|font-display)\b([^"]*)"/g, 'class="$1font-sans$3"');
  
  // 3. Fix tailwind text classes
  content = content.replace(/\b(?:sm:|md:|lg:|xl:)?text-(?:5xl|6xl|7xl|8xl|9xl)\b/g, 'text-hero-title');
  content = content.replace(/\b(?:sm:|md:|lg:|xl:)?text-[34]xl\b/g, 'text-section-title');
  content = content.replace(/\b(?:sm:|md:|lg:|xl:)?text-(?:lg|xl|2xl)\b/g, 'text-body-lead');

  // Remove duplicates like 'text-hero-title text-hero-title'
  content = content.replace(/\b(text-hero-title|text-section-title|text-body-lead)(?:\s+\1)+\b/g, '$1');

  // Strip font-size clamp inline styles if they exist
  content = content.replace(/font-size:\s*clamp\([^)]+\);?/g, '');
  // Any left over font-size styles that are large
  content = content.replace(/font-size:\s*[3-9][0-9](?:\.[0-9]+)?(?:px|rem);?/g, '');
  
  // Remove empty style tags and empty class attributes
  content = content.replace(/style="\s*"/g, '');
  content = content.replace(/class="\s*"/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.astro') || fullPath.endsWith('.css')) {
      processFile(fullPath);
    }
  }
}

// Add global CSS
const globalCssPath = path.join(STYLES_DIR, 'global.css');
if (fs.existsSync(globalCssPath)) {
  let globalCss = fs.readFileSync(globalCssPath, 'utf8');
  if (!globalCss.includes('text-hero-title')) {
    fs.writeFileSync(globalCssPath, globalCss + GLOBAL_CSS_ADDITION, 'utf8');
    console.log('Updated:', globalCssPath);
  }
}

traverse(PAGES_DIR);
traverse(COMPONENTS_DIR);
traverse(LAYOUTS_DIR);

console.log('Done processing typography.');
