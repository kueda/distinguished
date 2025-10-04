<script lang="ts">
  import type { Taxon } from '$lib/inat-api';
  import { searchTaxa } from '$lib/inat-api';
  import ImageCropper from '$lib/components/ImageCropper.svelte';
  import INatPhotoBrowser from '$lib/components/INatPhotoBrowser.svelte';
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
    photoAttribution?: string;
    linkUrl?: string;
  }

  let taxa = $state<Taxon[]>([]);
  let traits = $state<Trait[]>([]);
  let cells = $state<Cell[]>([]);
  let outputMode = $state<'comment' | 'journal'>('journal');
  let nameFormat = $state<'scientific' | 'common' | 'both'>('scientific');

  let searchQuery = $state('');
  let searchResults = $state<Taxon[]>([]);
  let selectedResultIndex = $state(-1);

  let cropperState = $state<{
    show: boolean;
    imageUrl: string;
    taxonId: number;
    traitId: string;
    existingCropBox?: CropBox;
  } | null>(null);

  let photoBrowserState = $state<{
    show: boolean;
    taxonId: number;
    traitId: string;
  } | null>(null);

  async function handleSearch() {
    searchResults = await searchTaxa(searchQuery);
    selectedResultIndex = -1;
  }

  function addTaxon(taxon: Taxon) {
    if (!taxa.find(t => t.id === taxon.id)) {
      taxa = [...taxa, taxon];
    }
    searchQuery = '';
    searchResults = [];
    selectedResultIndex = -1;
  }

  function handleSearchKeyDown(e: KeyboardEvent) {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedResultIndex = Math.min(selectedResultIndex + 1, searchResults.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedResultIndex = Math.max(selectedResultIndex - 1, -1);
    } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
      e.preventDefault();
      addTaxon(searchResults[selectedResultIndex]);
    } else if (e.key === 'Escape') {
      searchResults = [];
      selectedResultIndex = -1;
    }
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

  function openCropper(taxonId: number, traitId: string, editExisting = false) {
    const cell = getCell(taxonId, traitId);
    if (!cell?.imageUrl) return;
    cropperState = {
      show: true,
      imageUrl: cell.imageUrl,
      taxonId,
      traitId,
      existingCropBox: editExisting ? cell.cropBox : undefined
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

  function clearImage(taxonId: number, traitId: string) {
    updateCell(taxonId, traitId, {
      imageUrl: '',
      cropBox: undefined,
      photoAttribution: ''
    });
  }

  function openPhotoBrowser(taxonId: number, traitId: string) {
    photoBrowserState = { show: true, taxonId, traitId };
  }

  function handlePhotoSelect(imageUrl: string, linkUrl: string, attribution: string) {
    if (!photoBrowserState) return;
    updateCell(photoBrowserState.taxonId, photoBrowserState.traitId, {
      imageUrl,
      linkUrl,
      photoAttribution: attribution
    });
    photoBrowserState = null;
  }

  function closePhotoBrowser() {
    photoBrowserState = null;
  }

  let generatedHTML = $derived(
    outputMode === 'comment'
      ? generateCommentHTML(taxa, traits, cells, nameFormat)
      : generateJournalHTML(taxa, traits, cells, nameFormat)
  );

  async function copyHTML() {
    await navigator.clipboard.writeText(generatedHTML);
  }
</script>

<div class="app">
  <h1>Distinguished</h1>
  <p>Make comparison tables of species traits with photos for use on iNaturalist.</p>

  <section class="table-editor">
    <table>
        <thead>
          <tr>
            <th></th>
            {#each taxa as taxon}
              <th>
                <div class="taxon-header">
                  <span>{taxon.name}</span>
                  <button onclick={() => removeTaxon(taxon.id)}>Remove</button>
                </div>
              </th>
            {/each}
            <th class="control-cell">
              <div class="search-box">
                <label>
                  Add a Taxon
                  <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search for a taxon..."
                    oninput={handleSearch}
                    onkeydown={handleSearchKeyDown}
                  />
                </label>
                {#if searchResults.length > 0}
                  <ul class="results">
                    {#each searchResults as result, index}
                      <li class:selected={index === selectedResultIndex}>
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
            </th>
          </tr>
        </thead>
        <tbody>
          {#each traits as trait}
            <tr>
              <th class="control-cell">
                <div class="trait-header">
                  <input
                    type="text"
                    value={trait.description}
                    oninput={(e) => updateTrait(trait.id, e.currentTarget.value)}
                    placeholder="Trait description..."
                  />
                  <button onclick={() => removeTrait(trait.id)}>Remove</button>
                </div>
              </th>
              {#each taxa as taxon}
                <td>
                  <div class="taxon-trait">
                    <textarea
                      value={getCell(taxon.id, trait.id)?.description || ''}
                      oninput={(e) => updateCell(taxon.id, trait.id, {
                        description: e.currentTarget.value
                      })}
                      placeholder="How is/are {trait.description} different in {taxon.name}?"
                    ></textarea>
                    <div class="image-url-input">
                      <input
                        type="text"
                        value={getCell(taxon.id, trait.id)?.imageUrl || ''}
                        oninput={(e) => updateCell(taxon.id, trait.id, {
                          imageUrl: e.currentTarget.value
                        })}
                        placeholder="Image URL..."
                      />
                      {#if getCell(taxon.id, trait.id)?.imageUrl}
                        <button
                          class="clear-button"
                          onclick={() => clearImage(taxon.id, trait.id)}
                          title="Clear image"
                        >×</button>
                      {/if}
                    </div>
                    {#if !getCell(taxon.id, trait.id)?.imageUrl}
                      <button onclick={() => openPhotoBrowser(taxon.id, trait.id)}>
                        Add iNat Photo
                      </button>
                    {/if}
                    {#if getCell(taxon.id, trait.id)?.imageUrl}
                      {@const cell = getCell(taxon.id, trait.id)}
                      {#if cell?.cropBox}
                        <div class="crop-info">
                          <small>
                            Crop: {cell.cropBox.width}×{cell.cropBox.height} at ({cell.cropBox.x}, {cell.cropBox.y})
                          </small>
                          <button onclick={() => openCropper(taxon.id, trait.id, true)}>Edit Crop</button>
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
                      value={getCell(taxon.id, trait.id)?.photoAttribution || ''}
                      oninput={(e) => updateCell(taxon.id, trait.id, {
                        photoAttribution: e.currentTarget.value
                      })}
                      placeholder="Photo attribution (optional)..."
                    />
                    <input
                      type="text"
                      value={getCell(taxon.id, trait.id)?.linkUrl || ''}
                      oninput={(e) => updateCell(taxon.id, trait.id, {
                        linkUrl: e.currentTarget.value
                      })}
                      placeholder="Link URL (optional)..."
                    />
                  </div>
                </td>
              {/each}
              <td></td>
            </tr>
          {/each}
          <tr>
            <th class="control-cell">
              <button onclick={addTrait}>Add Trait</button>
            </th>
            {#each taxa as taxon}
              <td></td>
            {/each}
            <td></td>
          </tr>
        </tbody>
    </table>
  </section>

  <section class="output">
    <h2>Output</h2>
    <h3>Where are you posting this?</h3>
    <label>
      <input type="radio" bind:group={outputMode} value="journal" />
      Journal (uses CSS, more resilient to future changes)
    </label>
    <label>
      <input type="radio" bind:group={outputMode} value="comment" />
      Comment (uses a 3rd-party service to get around lack of CSS support)
    </label>

    <h3>Display Options</h3>
    <label>
      <input type="radio" bind:group={nameFormat} value="scientific" />
      Scientific name only
    </label>
    <label>
      <input type="radio" bind:group={nameFormat} value="common" />
      Common name only
    </label>
    <label>
      <input type="radio" bind:group={nameFormat} value="both" />
      Common name (scientific name)
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
    existingCropBox={cropperState.existingCropBox}
    onCrop={handleCrop}
    onCancel={closeCropper}
  />
{/if}

{#if photoBrowserState}
  <INatPhotoBrowser
    taxonId={photoBrowserState.taxonId}
    onSelect={handlePhotoSelect}
    onCancel={closePhotoBrowser}
  />
{/if}

<style>
  :global(body) {
    font-family: sans-serif;
  }
  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .control-cell {
    max-width: 100px;
  }
  .search-box {
    position: relative;
  }

  .search-box label {
    display: flex;
    flex-direction: column;
    justify-items: stretch;
  }
  .search-box input {
    display: block;
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

  .results li.selected button {
    background: #e0e0e0;
  }

  .taxon-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .taxon-header span {
    font-style: italic;
  }

  .trait-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .trait-header input {
    flex: 1;
    margin-bottom: 0;
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
    min-height: 60px;
  }

  input[type="text"] {
    max-width: 100%;
  }

  .taxon-trait {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .image-url-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .image-url-input input {
    flex: 1;
    padding-right: 30px;
  }

  .clear-button {
    position: absolute;
    right: 4px;
    background: none;
    border: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    color: #999;
    padding: 4px 8px;
  }

  .clear-button:hover {
    color: #333;
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
  :global(table.table th, table td) {
    vertical-align: top;
  }
  :global(figure) {
    margin: 0;
  }
  :global(.text-muted) {
    color: gray;
  }
</style>
