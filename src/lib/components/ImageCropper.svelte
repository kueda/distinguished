<script lang="ts">
  interface CropBox {
    x: number;
    y: number;
    width: number;
    height: number;
    imgWidth: number;
    imgHeight: number;
  }

  interface Props {
    imageUrl: string;
    onCrop: (cropBox: CropBox) => void;
    onCancel: () => void;
  }

  let { imageUrl, onCrop, onCancel }: Props = $props();

  let imageElement = $state<HTMLImageElement>();
  let selectionBox = $state({ display: false, left: 0, top: 0, width: 0, height: 0 });
  let isDrawing = $state(false);
  let startX = $state(0);
  let startY = $state(0);
  let forceSquare = $state(true);
  let overlayMouseDownTarget: EventTarget | null = null;

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    if (!imageElement) return;
    const rect = imageElement.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
    selectionBox = {
      display: true,
      left: startX,
      top: startY,
      width: 0,
      height: 0
    };

    // Add document-level listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDrawing || !imageElement) return;
    e.preventDefault();
    const rect = imageElement.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    let width = Math.abs(currentX - startX);
    let height = Math.abs(currentY - startY);

    if (forceSquare) {
      const size = Math.min(width, height);
      width = size;
      height = size;
    }

    // Calculate position based on drag direction
    const x = currentX < startX ? startX - width : startX;
    const y = currentY < startY ? startY - height : startY;

    selectionBox = { display: true, left: x, top: y, width, height };
  }

  function handleMouseUp() {
    if (!isDrawing || !imageElement) return;
    isDrawing = false;

    // Remove document-level listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function handleDone() {
    if (!imageElement) return;

    if (selectionBox.width > 5 && selectionBox.height > 5) {
      const rect = imageElement.getBoundingClientRect();
      const scaleX = imageElement.naturalWidth / rect.width;
      const scaleY = imageElement.naturalHeight / rect.height;

      const cropBox: CropBox = {
        x: Math.round(selectionBox.left * scaleX),
        y: Math.round(selectionBox.top * scaleY),
        width: Math.round(selectionBox.width * scaleX),
        height: Math.round(selectionBox.height * scaleY),
        imgWidth: imageElement.naturalWidth,
        imgHeight: imageElement.naturalHeight
      };

      onCrop(cropBox);
    }
  }

  function handleOverlayMouseDown(e: MouseEvent) {
    overlayMouseDownTarget = e.target;
  }

  function handleOverlayClick(e: MouseEvent) {
    // Only close if the click started and ended on the overlay (not from a drag)
    if (e.target === overlayMouseDownTarget) {
      onCancel();
    }
    overlayMouseDownTarget = null;
  }
</script>

<div class="modal-overlay" onmousedown={handleOverlayMouseDown} onclick={handleOverlayClick}>
  <div class="modal" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
    <h3>Crop Image</h3>
    <p>Click and drag to select the area to crop</p>

    <label>
      <input type="checkbox" bind:checked={forceSquare} />
      Lock to square aspect ratio
    </label>

    <div
      class="image-container"
      onmousedown={handleMouseDown}
    >
      <img bind:this={imageElement} src={imageUrl} alt="Crop source" draggable="false" />
      {#if selectionBox.display}
        <div
          class="selection-box"
          style="
            left: {selectionBox.left}px;
            top: {selectionBox.top}px;
            width: {selectionBox.width}px;
            height: {selectionBox.height}px;
          "
        ></div>
      {/if}
    </div>

    <div class="buttons">
      <button onclick={onCancel}>Cancel</button>
      <button onclick={handleDone}>Done</button>
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
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .image-container {
    position: relative;
    display: inline-block;
    cursor: crosshair;
    user-select: none;
    margin: 20px 0;
  }

  .image-container img {
    max-width: 100%;
    max-height: 60vh;
    display: block;
  }

  .selection-box {
    position: absolute;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
  }

  .buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
</style>
