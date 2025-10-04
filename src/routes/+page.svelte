<script lang="ts">
	import type { Taxon } from '$lib/inat-api';
	import { searchTaxa } from '$lib/inat-api';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import { generateCommentHTML, generateJournalHTML } from '$lib/html-generator';

	interface Trait {
		id: string;
		description: string;
	}

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

	let taxa = $state<Taxon[]>([]);
	let traits = $state<Trait[]>([]);
	let cells = $state<Cell[]>([]);
	let outputMode = $state<'comment' | 'journal'>('comment');

	let searchQuery = $state('');
	let searchResults = $state<Taxon[]>([]);

	let cropperState = $state<{
		show: boolean;
		imageUrl: string;
		taxonId: number;
		traitId: string;
	} | null>(null);

	async function handleSearch() {
		searchResults = await searchTaxa(searchQuery);
	}

	function addTaxon(taxon: Taxon) {
		if (!taxa.find(t => t.id === taxon.id)) {
			taxa = [...taxa, taxon];
		}
		searchQuery = '';
		searchResults = [];
	}

	function removeTaxon(id: number) {
		taxa = taxa.filter(t => t.id !== id);
		cells = cells.filter(c => c.taxonId !== id);
	}

	function addTrait() {
		const id = crypto.randomUUID();
		traits = [...traits, { id, description: '' }];
	}

	function removeTrait(id: string) {
		traits = traits.filter(t => t.id !== id);
		cells = cells.filter(c => c.traitId !== id);
	}

	function updateTrait(id: string, description: string) {
		traits = traits.map(t => t.id === id ? { ...t, description } : t);
	}

	function getCell(taxonId: number, traitId: string): Cell | undefined {
		return cells.find(c => c.taxonId === taxonId && c.traitId === traitId);
	}

	function updateCell(taxonId: number, traitId: string, data: Partial<Cell>) {
		const existing = getCell(taxonId, traitId);
		if (existing) {
			cells = cells.map(c =>
				c.taxonId === taxonId && c.traitId === traitId ? { ...c, ...data } : c
			);
		} else {
			cells = [...cells, {
				taxonId,
				traitId,
				description: '',
				imageUrl: '',
				...data
			}];
		}
	}

	function openCropper(taxonId: number, traitId: string) {
		const cell = getCell(taxonId, traitId);
		if (!cell?.imageUrl) return;
		cropperState = {
			show: true,
			imageUrl: cell.imageUrl,
			taxonId,
			traitId
		};
	}

	function handleCrop(cropBox: CropBox) {
		if (!cropperState) return;
		updateCell(cropperState.taxonId, cropperState.traitId, { cropBox });
		cropperState = null;
	}

	function closeCropper() {
		cropperState = null;
	}

	function clearCrop(taxonId: number, traitId: string) {
		updateCell(taxonId, traitId, { cropBox: undefined });
	}

	let generatedHTML = $derived(
		outputMode === 'comment'
			? generateCommentHTML(taxa, traits, cells)
			: generateJournalHTML(taxa, traits, cells)
	);

	async function copyHTML() {
		await navigator.clipboard.writeText(generatedHTML);
	}
</script>

<div class="app">
	<h1>Distinguished</h1>

	<section class="taxon-selector">
		<h2>Taxa</h2>
		<div class="search-box">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search for a taxon..."
				oninput={handleSearch}
			/>
			{#if searchResults.length > 0}
				<ul class="results">
					{#each searchResults as result}
						<li>
							<button onclick={() => addTaxon(result)}>
								<strong>{result.name}</strong>
								{#if result.preferred_common_name}
									({result.preferred_common_name})
								{/if}
								- {result.rank}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<ul class="selected-taxa">
			{#each taxa as taxon}
				<li>
					<strong>{taxon.name}</strong>
					<button onclick={() => removeTaxon(taxon.id)}>Remove</button>
				</li>
			{/each}
		</ul>
	</section>

	<section class="traits-section">
		<h2>Traits</h2>
		<button onclick={addTrait}>Add Trait</button>
		<ul>
			{#each traits as trait}
				<li>
					<input
						type="text"
						value={trait.description}
						oninput={(e) => updateTrait(trait.id, e.currentTarget.value)}
						placeholder="Trait description..."
					/>
					<button onclick={() => removeTrait(trait.id)}>Remove</button>
				</li>
			{/each}
		</ul>
	</section>

	<section class="table-editor">
		<h2>Table</h2>
		{#if taxa.length > 0 && traits.length > 0}
			<table>
				<thead>
					<tr>
						<th></th>
						{#each taxa as taxon}
							<th>{taxon.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each traits as trait}
						<tr>
							<th>{trait.description}</th>
							{#each taxa as taxon}
								<td>
									<textarea
										value={getCell(taxon.id, trait.id)?.description || ''}
										oninput={(e) => updateCell(taxon.id, trait.id, {
											description: e.currentTarget.value
										})}
										placeholder="How is {trait.description} different in {taxon.name}?"
									></textarea>
									<input
										type="text"
										value={getCell(taxon.id, trait.id)?.imageUrl || ''}
										oninput={(e) => updateCell(taxon.id, trait.id, {
											imageUrl: e.currentTarget.value
										})}
										placeholder="Image URL..."
									/>
									{#if getCell(taxon.id, trait.id)?.imageUrl}
										{@const cell = getCell(taxon.id, trait.id)}
										{#if cell?.cropBox}
											<div class="crop-info">
												<small>
													Crop: {cell.cropBox.width}×{cell.cropBox.height} at ({cell.cropBox.x}, {cell.cropBox.y})
												</small>
												<button onclick={() => clearCrop(taxon.id, trait.id)}>Clear Crop</button>
											</div>
										{:else}
											<button onclick={() => openCropper(taxon.id, trait.id)}>
												Crop Image
											</button>
										{/if}
									{/if}
									<input
										type="text"
										value={getCell(taxon.id, trait.id)?.linkUrl || ''}
										oninput={(e) => updateCell(taxon.id, trait.id, {
											linkUrl: e.currentTarget.value
										})}
										placeholder="Link URL (optional)..."
									/>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<section class="output">
		<h2>Output</h2>
		<label>
			<input type="radio" bind:group={outputMode} value="comment" />
			Comment (weserv.nl proxy)
		</label>
		<label>
			<input type="radio" bind:group={outputMode} value="journal" />
			Journal (CSS cropping)
		</label>

		{#if taxa.length > 0 && traits.length > 0}
			<div class="preview">
				<h3>Preview</h3>
				{@html generatedHTML}
			</div>

			<div class="html-output">
				<button onclick={copyHTML}>Copy HTML</button>
				<pre><code>{generatedHTML}</code></pre>
			</div>
		{/if}
	</section>
</div>

{#if cropperState}
	<ImageCropper
		imageUrl={cropperState.imageUrl}
		onCrop={handleCrop}
		onCancel={closeCropper}
	/>
{/if}

<style>
	.app {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.search-box {
		position: relative;
	}

	.results {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		list-style: none;
		padding: 0;
		margin: 0;
		max-height: 200px;
		overflow-y: auto;
		width: 100%;
		z-index: 10;
	}

	.results li button {
		width: 100%;
		text-align: left;
		padding: 8px;
		border: none;
		background: none;
		cursor: pointer;
	}

	.results li button:hover {
		background: #f0f0f0;
	}

	.selected-taxa {
		list-style: none;
		padding: 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		border: 1px solid #ccc;
		padding: 8px;
	}

	textarea {
		width: 100%;
		min-height: 60px;
		margin-bottom: 4px;
	}

	input[type="text"] {
		width: 100%;
		margin-bottom: 4px;
	}

	.crop-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.crop-info small {
		color: #666;
	}

	.html-output {
		margin-top: 20px;
	}

	.html-output pre {
		background: #f5f5f5;
		padding: 15px;
		border-radius: 4px;
		overflow-x: auto;
		max-height: 300px;
	}

	.preview {
		margin-top: 30px;
		padding: 20px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	:global(.img-responsive) {
		max-width: 100%;
	}
	:global(table.table) {
		width: 100%;
	}
</style>
