import type { Taxon } from './inat-api';

interface CropBox {
	x: number;
	y: number;
	width: number;
	height: number;
	imgWidth: number;
	imgHeight: number;
}

interface Cell {
	taxonId: number;
	traitId: string;
	description: string;
	imageUrl: string;
	cropBox?: CropBox;
	linkUrl?: string;
}

interface Trait {
	id: string;
	description: string;
}

export function generateCommentHTML(
	taxa: Taxon[],
	traits: Trait[],
	cells: Cell[]
): string {
	const taxonWidth = taxa.length > 0 ? Math.floor(90 / taxa.length) : 90;

	let html = '<table class="table">\n';
	html += '  <thead>\n    <tr>\n      <th width="10%"></th>\n';

	taxa.forEach(taxon => {
		html += `      <th width="${taxonWidth}%"><i>${taxon.name}</i></th>\n`;
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

				if (cell.imageUrl) {
					const imgSrc = cell.cropBox
						? generateWeservURL(cell.imageUrl, cell.cropBox)
						: cell.imageUrl;

					if (cell.linkUrl) {
						html += `        <p><a href="${cell.linkUrl}">\n`;
						html += `          <img class="img-responsive" src="${imgSrc}" alt="${cell.description || trait.description}" />\n`;
						html += '        </a></p>\n';
					} else {
						html += `        <p>\n`;
						html += `          <img class="img-responsive" src="${imgSrc}" alt="${cell.description || trait.description}" />\n`;
						html += '        </p>\n';
					}
				}
			}

			html += '      </td>\n';
		});

		html += '    </tr>\n';
	});

	html += '  </tbody>\n</table>';
	return html;
}

export function generateJournalHTML(
	taxa: Taxon[],
	traits: Trait[],
	cells: Cell[]
): string {
	const taxonWidth = taxa.length > 0 ? Math.floor(90 / taxa.length) : 90;

	let html = '<table class="table">\n';
	html += '  <thead>\n    <tr>\n      <th width="10%"></th>\n';

	taxa.forEach(taxon => {
		html += `      <th width="${taxonWidth}%"><i>${taxon.name}</i></th>\n`;
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

				if (cell.imageUrl && cell.cropBox) {
					const containerStyle = generateCSSCropContainer(cell.cropBox);
					const imageStyle = generateCSSCropImage(cell.imageUrl, cell.cropBox);

					const tag = cell.linkUrl ? 'a' : 'div';
					const hrefAttr = cell.linkUrl ? ` href="${cell.linkUrl}"` : '';

					html += `        <${tag}${hrefAttr} style="${containerStyle}">\n`;
					html += `          <img src="${cell.imageUrl}" style="${imageStyle}" alt="${cell.description || trait.description}" />\n`;
					html += `        </${tag}>\n`;
				} else if (cell.imageUrl) {
					if (cell.linkUrl) {
						html += `        <a href="${cell.linkUrl}">\n`;
						html += `          <img src="${cell.imageUrl}" alt="${cell.description || trait.description}" />\n`;
						html += '        </a>\n';
					} else {
						html += `        <img src="${cell.imageUrl}" alt="${cell.description || trait.description}" />\n`;
					}
				}
			}

			html += '      </td>\n';
		});

		html += '    </tr>\n';
	});

	html += '  </tbody>\n</table>';
	return html;
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

	return `position: absolute; width: ${imageWidthPercent}%; height: auto; left: 50%; top: 50%; transform: translate(calc(-50% - ${offsetX}%), calc(-50% - ${offsetY}%));`;
}
