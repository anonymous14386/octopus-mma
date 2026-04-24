declare module "gif.js" {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    workerScript?: string;
    width?: number;
    height?: number;
    repeat?: number;
    background?: string;
    transparent?: number | null;
    dither?: boolean | string;
  }
  interface FrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }
  class GIF {
    constructor(options: GIFOptions);
    addFrame(
      source: HTMLCanvasElement | CanvasRenderingContext2D | ImageData,
      options?: FrameOptions
    ): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "progress", cb: (p: number) => void): void;
    render(): void;
  }
  export = GIF;
}
