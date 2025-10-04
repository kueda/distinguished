<script lang="ts">
  interface Photo {
    url: string;
    observationUrl: string;
    id: number;
    attribution: string;
  }

  interface Props {
    taxonId: number;
    onSelect: (imageUrl: string, linkUrl: string, attribution: string) => void;
    onCancel: () => void;
  }

  let { taxonId, onSelect, onCancel }: Props = $props();

  let photos = $state<Photo[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let overlayMouseDownTarget: EventTarget | null = null;

  async function loadPhotos() {
    try {
      loading = true;
      error = null;
      const response = await fetch(
        `https://api.inaturalist.org/v1/observations?quality_grade=research,needs_id&taxon_id=${taxonId}&per_page=200&order=desc&order_by=votes`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch observations');
      }

      const data = await response.json();
      photos = data.results
        .filter((obs: any) => obs.photos && obs.photos.length > 0)
        .map((obs: any) => ({
          url: obs.photos[0].url,
          observationUrl: obs.uri,
          id: obs.id,
          attribution: obs.photos[0].attribution
        }));

      loading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      loading = false;
    }
  }

  function handlePhotoClick(photo: Photo) {
    const originalUrl = photo.url.replace(/\/square\./, '/original.');
    onSelect(originalUrl, photo.observationUrl, photo.attribution);
  }

  function handleOverlayMouseDown(e: MouseEvent) {
    overlayMouseDownTarget = e.target;
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === overlayMouseDownTarget) {
      onCancel();
    }
    overlayMouseDownTarget = null;
  }

  function handleOverlayKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  $effect(() => {
    loadPhotos();
  });
</script>

<div
  class="modal-overlay"
  role="presentation"
  onmousedown={handleOverlayMouseDown}
  onclick={handleOverlayClick}
  onkeydown={handleOverlayKeyDown}
>
  <div
    class="modal"
    role="dialog"
    tabindex="0"
    aria-modal="true"
    aria-labelledby="photo-browser-title"
    onclick={(e) => e.stopPropagation()}
    onmousedown={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <h3 id="photo-browser-title">Select iNaturalist Photo</h3>
    <p>From the most popular 200 observations. You can also just paste an image URL directly into the form.</p>

    {#if loading}
      <p>Loading photos...</p>
    {:else if error}
      <p class="error">Error: {error}</p>
    {:else if photos.length === 0}
      <p>No photos found for this taxon.</p>
    {:else}
      <div class="photo-grid">
        {#each photos as photo}
          <button
            class="photo-button"
            onclick={() => handlePhotoClick(photo)}
            type="button"
          >
            <img src={photo.url.replace("square", "medium")} alt="Observation photo {photo.id}" />
          </button>
        {/each}
      </div>
    {/if}

    <div class="buttons">
      <button onclick={onCancel}>Cancel</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin: 20px 0;
  }

  .photo-button {
    padding: 0;
    border: 2px solid #ddd;
    background: none;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .photo-button:hover {
    border-color: #3b82f6;
  }

  .photo-button img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }

  .error {
    color: red;
  }

  .buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 10px;
  }
</style>
