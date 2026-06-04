/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      poster?: string;
      'camera-controls'?: boolean | string;
      'auto-rotate'?: boolean | string;
      'shadow-intensity'?: string;
      alt?: string;
      'touch-action'?: string;
    };
  }
}
