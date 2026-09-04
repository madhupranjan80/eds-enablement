import { createOptimizedPicture } from '../../scripts/aem.js';

function readImageSrc(row) {
  const img = row.querySelector('img');
  if (img) return { src: img.src, alt: img.alt };

  const link = row.querySelector('a');
  if (link) return { src: link.href, alt: '' };

  const literal = row.textContent.match(/src=["']([^"']+)["']/i);
  if (literal) return { src: literal[1], alt: '' };

  return { src: row.textContent.trim(), alt: '' };
}

export default function decorate(block) {
  const [imageRow, titleRow, colorRow] = [...block.children];

  if (imageRow) {
    imageRow.className = 'banner-image';
    const { src, alt } = readImageSrc(imageRow);
    if (src) imageRow.replaceChildren(createOptimizedPicture(src, alt, true, [{ width: '750' }]));
  }

  if (titleRow) titleRow.className = 'banner-title';

  if (colorRow) {
    const cells = [...colorRow.children];
    const color = (cells[cells.length - 1] || colorRow).textContent.trim();
    if (color) block.style.setProperty('--banner-background-color', color);
    colorRow.remove();
  }
}
