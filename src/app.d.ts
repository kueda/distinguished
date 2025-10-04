// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
  imgWidth: number;
  imgHeight: number;
}

export interface Cell {
  taxonId: number;
  traitId: string;
  description: string;
  imageUrl: string;
  cropBox?: CropBox;
  photoAttribution?: string;
  linkUrl?: string;
}
