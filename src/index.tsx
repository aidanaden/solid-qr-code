import { defaultFrameOptions, generateFrame } from "scannable/qr";
import {
  Component,
  ComponentProps,
  For,
  JSX,
  createEffect,
  createMemo,
  mergeProps,
} from "solid-js";

type Excavation = { x: number; y: number; w: number; h: number };

export type ImageSettings = {
  src: string;
  height: number;
  width: number;
  excavate: boolean;
  x?: number;
  y?: number;
  opacity?: number;
};

type QRProps = {
  value: string;
  size?: number;
  // Should be a real enum, but doesn't seem to be compatible with real code.
  level?: ErrorEvent;
  bgColor?: string;
  fgColor?: string;
  style?: JSX.CSSProperties;
  includeMargin?: boolean;
  marginSize?: number;
  imageSettings?: ImageSettings;
  title?: string;
  minVersion?: number;
};
type QRPropsCanvas = QRProps & ComponentProps<"canvas">;
type QRPropsSVG = QRProps & ComponentProps<"svg">;

const DEFAULT_SIZE = 128;
// const DEFAULT_LEVEL: ErrorLevel = "L";
const DEFAULT_BGCOLOR = "#FFFFFF";
const DEFAULT_FGCOLOR = "#000000";
const DEFAULT_INCLUDEMARGIN = false;
const DEFAULT_MINVERSION = 1;

const SPEC_MARGIN_SIZE = 4;
const DEFAULT_MARGIN_SIZE = 0;

export const ErrorCorrectionLevel = {
  LOW: "low",
  MEDIUM: "medium",
  QUARTILE: "quartile",
  HIGH: "high",
} as const;
export type ErrorCorrectionLevel =
  (typeof ErrorCorrectionLevel)[keyof typeof ErrorCorrectionLevel];

export type ErrorCorrection = {
  ordinal: number;
  formatBits: number;
};

export const MaskType = {
  ALTERNATING_TILES: 0,
  ALTERNATING_HORIZONTAL_LINES: 1,
  ALTERNATING_VERTICAL_LINES_TWO_GAP: 2,
  DIAGONAL: 3,
  FOUR_BY_TWO_RECTANGLE_ALTERNATING: 4,
  FLOWER_IN_SQAURE: 5,
  DIAGONAL_SQUARE: 6,
  ALTERNATING_PUZZLE_PIECE: 7,
} as const;
export type MaskType = (typeof MaskType)[keyof typeof MaskType];

export type FrameOptions = {
  /** The value to be encoded. */
  readonly value: string;
  /** The ECC level to be used. Default is L */
  readonly level: ErrorCorrection | ErrorCorrectionLevel;
  /** The mask type. IF none is specified, one will be automatically chosen based on badness. */
  readonly maskType?: MaskType;
};

/**
 * Renders a QR code into an SVG html string.
 *
 * @param options - the options to use for the frame.
 *
 * @returns The QR code html as a string
 */
export type QRSVGProps = FrameOptions & {
  readonly backgroundColor: string;
  readonly backgroundAlpha: number;
  readonly foregroundColor: string;
  readonly foregroundAlpha: number;
  readonly width: number;
  readonly height: number;
  readonly value: string;
};
export const QRCodeSVG: Component<QRSVGProps> = (_props) => {
  const props = mergeProps(
    {
      backgroundColor: "white",
      backgroundAlpha: 1,
      foregroundColor: "black",
      foregroundAlpha: 1,
      width: 100,
      height: 100,
      ...defaultFrameOptions,
    },
    _props
  );
  const frame = createMemo(() => generateFrame(props));
  const moduleSizeWidth = createMemo(() => props.width / frame().size);
  const moduleSizeHeight = createMemo(() => props.height / frame().size);
  const rectangles = createMemo(() => {
    let rects: { x: number; y: number; enabled: boolean }[] = [];
    for (let i = 0; i < frame().size; i++) {
      for (let j = 0; j < frame().size; j++) {
        rects = [
          ...rects,
          {
            x: moduleSizeWidth() * i,
            y: moduleSizeHeight() * j,
            enabled: frame().buffer[j * frame().size + i] === 1,
          },
        ];
      }
    }
    return rects;
  });
  return (
    <svg width={props.width} height={props.height}>
      <For each={rectangles()}>
        {(rectangle) => (
          <rect
            width={moduleSizeWidth()}
            height={moduleSizeHeight()}
            x={rectangle.x}
            y={rectangle.y}
            style={{
              fill: rectangle.enabled
                ? props.foregroundColor
                : props.backgroundColor,
              opacity: rectangle.enabled
                ? props.foregroundAlpha
                : props.backgroundAlpha,
            }}
          />
        )}
      </For>
    </svg>
  );
};

export type QRCanvasProps = FrameOptions & {
  readonly backgroundColor: string;
  readonly backgroundAlpha: number;
  readonly foregroundColor: string;
  readonly foregroundAlpha: number;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
};

/**
 * Renders a QR code onto a canvas context
 *
 * @param options - the options to use for the frame.
 * @param context - The canvas context to use
 * @param width - The width of the QR code, **not the canvas**
 * @param height - The height of the QR code, **not the canvas**
 */
export const QRCodeCanvas: Component<QRCanvasProps> = (_props) => {
  const props = mergeProps(
    {
      backgroundColor: "white",
      backgroundAlpha: 1,
      foregroundColor: "black",
      foregroundAlpha: 1,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      ...defaultFrameOptions,
    },
    _props
  );
  let ref: HTMLCanvasElement;
  const frame = createMemo(() => generateFrame(props));
  const rawModuleSizeWidth = createMemo(() => props.width / frame().size);
  const rawModuleSizeHeight = createMemo(() => props.height / frame().size);

  const offsetX = createMemo(
    () => ((rawModuleSizeWidth() % 1) * frame().size) / 2
  );
  const offsetY = createMemo(
    () => ((rawModuleSizeHeight() % 1) * frame().size) / 2
  );

  const moduleSizeWidth = createMemo(() => Math.floor(rawModuleSizeWidth()));
  const moduleSizeHeight = createMemo(() => Math.floor(rawModuleSizeHeight()));

  createEffect(() => {
    const context = ref.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, ref.width, ref.height);
    for (let i = 0; i < frame().size; i++) {
      for (let j = 0; j < frame().size; j++) {
        if (frame().buffer[j * frame().size + i]) {
          context.fillStyle = props.foregroundColor;
          context.globalAlpha = props.foregroundAlpha;

          context.fillRect(
            offsetX() + moduleSizeWidth() * i + props.x,
            offsetY() + moduleSizeHeight() * j + props.y,
            moduleSizeWidth(),
            moduleSizeHeight()
          );
        } else {
          context.fillStyle = props.backgroundColor;
          context.globalAlpha = props.backgroundAlpha;

          context.fillRect(
            offsetX() + moduleSizeWidth() * i + props.x,
            offsetY() + moduleSizeHeight() * j + props.y,
            moduleSizeWidth(),
            moduleSizeHeight()
          );
        }
      }
    }
  });

  return <canvas ref={(e) => (ref = e)} />;
};
