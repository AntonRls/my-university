declare module 'qrcode.react' {
  import type { CSSProperties, ReactElement } from 'react';

  export interface QRCodeCanvasProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
    bgColor?: string;
    fgColor?: string;
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate?: boolean;
      x?: number;
      y?: number;
    };
    style?: CSSProperties;
    className?: string;
  }

  // eslint-disable-next-line no-unused-vars
  export function QRCodeCanvas(props: QRCodeCanvasProps): ReactElement;

  export interface QRCodeSVGProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
    bgColor?: string;
    fgColor?: string;
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate?: boolean;
      x?: number;
      y?: number;
    };
    style?: CSSProperties;
    className?: string;
  }

  // eslint-disable-next-line no-unused-vars
  export function QRCodeSVG(props: QRCodeSVGProps): ReactElement;
}

