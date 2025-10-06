import type { Taxon } from './inat-api';
import type { CropBox, Cell } from '../app';

interface Trait {
  id: string;
  description: string;
}

function formatTaxonName(
  taxon: Taxon,
  format: 'scientific' | 'common' | 'both'
): string {
  if (format === 'scientific') {
    return `<i>${taxon.name}</i>`;
  }

  if (format === 'common') {
    return taxon.preferred_common_name
      ? taxon.preferred_common_name
      : `<i>${taxon.name}</i>`;
  }

  // format === 'both'
  return taxon.preferred_common_name
    ? `${taxon.preferred_common_name} (<i>${taxon.name}</i>)`
    : `<i>${taxon.name}</i>`;
}

type ImageRenderer = (
  cell: Cell,
  trait: Trait
) => string;

function generateCommentImage(cell: Cell, trait: Trait): string {
  if (!cell.imageUrl) return '';

  const imgSrc = cell.cropBox
    ? generateWeservURL(cell.imageUrl, cell.cropBox)
    : cell.imageUrl;

  const imgTag = `<img class="img-responsive" src="${imgSrc}" alt="${cell.description || trait.description}" />`;
  const imgContent = cell.linkUrl ? `<a href="${cell.linkUrl}">${imgTag}</a>` : imgTag;

  if (cell.photoAttribution) {
    return `        <figure>\n          ${imgContent}\n          <figcaption>${cell.photoAttribution}</figcaption>\n        </figure>\n`;
  }
  return `        <p>${imgContent}</p>\n`;
}

function generateJournalImage(cell: Cell, trait: Trait): string {
  if (!cell.imageUrl) return '';

  if (cell.cropBox) {
    const containerStyle = generateCSSCropContainer(cell.cropBox);
    const imageStyle = generateCSSCropImage(cell.imageUrl, cell.cropBox);

    const tag = cell.linkUrl ? 'a' : 'div';
    const hrefAttr = cell.linkUrl ? ` href="${cell.linkUrl}"` : '';

    const imgContent = `<${tag}${hrefAttr} style="${containerStyle}"><img src="${cell.imageUrl}" style="${imageStyle}" alt="${cell.description || trait.description}" /></${tag}>`;

    if (cell.photoAttribution) {
      return `        <figure>\n          ${imgContent}\n          <figcaption>${cell.photoAttribution}</figcaption>\n        </figure>\n`;
    }
    return `        ${imgContent}\n`;
  }

  const imgTag = `<img style="width: 100%" src="${cell.imageUrl}" alt="${cell.description || trait.description}" />`;
  const imgContent = cell.linkUrl ? `<a href="${cell.linkUrl}">${imgTag}</a>` : imgTag;

  if (cell.photoAttribution) {
    return `        <figure>\n          ${imgContent}\n          <figcaption>${cell.photoAttribution}</figcaption>\n        </figure>\n`;
  }
  return `        ${imgContent}\n`;
}

function generateTableHTML(
  taxa: Taxon[],
  traits: Trait[],
  cells: Cell[],
  nameFormat: 'scientific' | 'common' | 'both',
  renderImage: ImageRenderer,
  includeFooter: boolean = false
): string {
  const taxonWidth = taxa.length > 0 ? Math.floor(90 / taxa.length) : 90;

  let html = '<table class="table">\n';
  html += '  <thead>\n    <tr>\n      <th width="10%"></th>\n';

  taxa.forEach(taxon => {
    const displayName = formatTaxonName(taxon, nameFormat);
    html += `      <th width="${taxonWidth}%"><a href="https://www.inaturalist.org/taxa/${taxon.id}">${displayName}</a></th>\n`;
  });

  html += '    </tr>\n  </thead>\n  <tbody>\n';

  traits.forEach(trait => {
    html += '    <tr>\n';
    html += `      <th width="10%">\n        <p>${trait.description}</p>\n      </th>\n`;

    taxa.forEach(taxon => {
      const cell = cells.find(c => c.taxonId === taxon.id && c.traitId === trait.id);
      html += `      <td width="${taxonWidth}%">\n`;

      if (cell) {
        if (cell.description) {
          html += `        <p>${cell.description}</p>\n`;
        }
        html += renderImage(cell, trait);
      }

      html += '      </td>\n';
    });

    html += '    </tr>\n';
  });

  html += '  </tbody>\n</table>';

  if (includeFooter) {
    const toolUrl = typeof window !== 'undefined' ? window.location.href : 'https://kueda.github.io/distinguished/';
    html += `\n<p class="text-muted"><small>Tables made with <a href="${toolUrl}">Distinguished</a></small></p>`;
  }

  return html;
}

export function generateCommentHTML(
  taxa: Taxon[],
  traits: Trait[],
  cells: Cell[],
  nameFormat: 'scientific' | 'common' | 'both' = 'scientific'
): string {
  return generateTableHTML(taxa, traits, cells, nameFormat, generateCommentImage);
}

export function generateJournalHTML(
  taxa: Taxon[],
  traits: Trait[],
  cells: Cell[],
  nameFormat: 'scientific' | 'common' | 'both' = 'scientific'
): string {
  return generateTableHTML(taxa, traits, cells, nameFormat, generateJournalImage, true);
}

function generateWeservURL(imageUrl: string, cropBox: CropBox): string {
  const encodedUrl = encodeURIComponent(imageUrl);
  return `https://images.weserv.nl/?url=${encodedUrl}&cx=${cropBox.x}&cy=${cropBox.y}&cw=${cropBox.width}&ch=${cropBox.height}`;
}

function generateCSSCropContainer(cropBox: CropBox): string {
  const aspectRatio = ((cropBox.height / cropBox.width) * 100).toFixed(2);
  return `width: 100%; padding-bottom: ${aspectRatio}%; position: relative; overflow: hidden; display: block;`;
}

function generateCSSCropImage(imageUrl: string, cropBox: CropBox): string {
  const centerX = cropBox.x + cropBox.width / 2;
  const centerY = cropBox.y + cropBox.height / 2;

  const centerXPercent = ((centerX / cropBox.imgWidth) * 100).toFixed(2);
  const centerYPercent = ((centerY / cropBox.imgHeight) * 100).toFixed(2);

  const imageWidthPercent = ((cropBox.imgWidth / cropBox.width) * 100).toFixed(2);

  const offsetX = (parseFloat(centerXPercent) - 50).toFixed(2);
  const offsetY = (parseFloat(centerYPercent) - 50).toFixed(2);

  return `position: absolute; width: ${imageWidthPercent}%; max-width: revert; height: auto; left: 50%; top: 50%; transform: translate(calc(-50% - ${offsetX}%), calc(-50% - ${offsetY}%));`;
}
