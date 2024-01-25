import {
  Component,
  ComponentProps,
  Show,
  createEffect,
  createMemo,
  mergeProps,
  splitProps,
} from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import qrcodegen from "./third-party/qrcodegen";

type Modules = ReturnType<qrcodegen.QrCode["getModules"]>;
type Excavation = { x: number; y: number; w: number; h: number };

const ERROR_LEVEL_MAP = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
} as const;
export type ErrorLevel = keyof typeof ERROR_LEVEL_MAP;

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
  level?: ErrorLevel;
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
const DEFAULT_LEVEL: ErrorLevel = "L";
const DEFAULT_BGCOLOR = "#FFFFFF";
const DEFAULT_FGCOLOR = "#000000";
const DEFAULT_INCLUDEMARGIN = false;
const DEFAULT_MINVERSION = 1;

const SPEC_MARGIN_SIZE = 4;
const DEFAULT_MARGIN_SIZE = 0;

// This is *very* rough estimate of max amount of QRCode allowed to be covered.
// It is "wrong" in a lot of ways (area is a terrible way to estimate, it
// really should be number of modules covered), but if for some reason we don't
// get an explicit height or width, I'd rather default to something than throw.
const DEFAULT_IMG_SCALE = 0.1;

function generatePath(modules: Modules, margin: number = 0): string {
  const ops: string[] = [];
  modules.forEach(function (row, y) {
    let start: number | null = null;
    row.forEach(function (cell, x) {
      if (!cell && start !== null) {
        // M0 0h7v1H0z injects the space with the move and drops the comma,
        // saving a char per operation
        ops.push(
          `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`
        );
        start = null;
        return;
      }

      // end of row, clean up or skip
      if (x === row.length - 1) {
        if (!cell) {
          // We would have closed the op above already so this can only mean
          // 2+ light modules in a row.
          return;
        }
        if (start === null) {
          // Just a single dark module.
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`);
        } else {
          // Otherwise finish the current line.
          ops.push(
            `M${start + margin},${y + margin} h${x + 1 - start}v1H${
              start + margin
            }z`
          );
        }
        return;
      }

      if (cell && start === null) {
        start = x;
      }
    });
  });
  return ops.join("");
}

// We could just do this in generatePath, except that we want to support
// non-Path2D canvas, so we need to keep it an explicit step.
function excavateModules(modules: Modules, excavation: Excavation): Modules {
  return modules.slice().map((row, y) => {
    if (y < excavation.y || y >= excavation.y + excavation.h) {
      return row;
    }
    return row.map((cell, x) => {
      if (x < excavation.x || x >= excavation.x + excavation.w) {
        return cell;
      }
      return false;
    });
  });
}

function getImageSettings(
  cells: Modules,
  size: number,
  margin: number,
  imageSettings?: ImageSettings
): null | {
  x: number;
  y: number;
  h: number;
  w: number;
  excavation: Excavation | null;
  opacity: number;
} {
  if (imageSettings == null) {
    return null;
  }
  const numCells = cells.length + margin * 2;
  const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
  const scale = numCells / size;
  const w = (imageSettings.width || defaultSize) * scale;
  const h = (imageSettings.height || defaultSize) * scale;
  const x =
    imageSettings.x == null
      ? cells.length / 2 - w / 2
      : imageSettings.x * scale;
  const y =
    imageSettings.y == null
      ? cells.length / 2 - h / 2
      : imageSettings.y * scale;
  const opacity = imageSettings.opacity == null ? 1 : imageSettings.opacity;

  let excavation = null;
  if (imageSettings.excavate) {
    let floorX = Math.floor(x);
    let floorY = Math.floor(y);
    let ceilW = Math.ceil(w + x - floorX);
    let ceilH = Math.ceil(h + y - floorY);
    excavation = { x: floorX, y: floorY, w: ceilW, h: ceilH };
  }

  return { x, y, h, w, excavation, opacity };
}

function getMarginSize(includeMargin: boolean, marginSize?: number): number {
  if (marginSize != null) {
    return Math.floor(marginSize);
  }
  return includeMargin ? SPEC_MARGIN_SIZE : DEFAULT_MARGIN_SIZE;
}

function makeQRCode({
  value,
  level,
  minVersion,
}: {
  value: string;
  level: ErrorLevel;
  minVersion: number;
}): qrcodegen.QrCode {
  const segments = qrcodegen.QrSegment.makeSegments(value);
  return qrcodegen.QrCode.encodeSegments(
    segments,
    ERROR_LEVEL_MAP[level],
    minVersion
  );
}

// For canvas we're going to switch our drawing mode based on whether or not
// the environment supports Path2D. We only need the constructor to be
// supported, but Edge doesn't actually support the path (string) type
// argument. Luckily it also doesn't support the addPath() method. We can
// treat that as the same thing.
const SUPPORTS_PATH2D = (function () {
  try {
    new Path2D().addPath(new Path2D());
  } catch (e) {
    return false;
  }
  return true;
})();

const QRCodeCanvas: Component<QRPropsCanvas> = (_props) => {
  const props = mergeProps(
    {
      size: DEFAULT_SIZE,
      level: DEFAULT_LEVEL,
      bgColor: DEFAULT_BGCOLOR,
      fgColor: DEFAULT_FGCOLOR,
      includeMargin: DEFAULT_INCLUDEMARGIN,
      minVersion: DEFAULT_MINVERSION,
    },
    _props
  );
  const [, rest] = splitProps(props, [
    "value",
    "size",
    "level",
    "bgColor",
    "fgColor",
    "includeMargin",
    "minVersion",
    "marginSize",
    "style",
    "imageSettings",
  ]);
  const imgSrc = createMemo(() => props.imageSettings?.src);
  let canvas: HTMLCanvasElement | undefined;
  let image: HTMLImageElement | undefined;

  createEffect(() => {
    if (canvas == null) {
      return;
    }

    // Always update the canvas. It's cheap enough and we want to be correct
    // with the current state.
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let qrcode = makeQRCode({
      value: props.value,
      level: props.level,
      minVersion: props.minVersion,
    });
    let cells = qrcode.getModules();

    const margin = getMarginSize(props.includeMargin, props.marginSize);
    const numCells = cells.length + margin * 2;
    const calculatedImageSettings = getImageSettings(
      cells,
      props.size,
      margin,
      props.imageSettings
    );

    const haveImageToRender =
      calculatedImageSettings != null &&
      image !== null &&
      image?.complete &&
      image.naturalHeight !== 0 &&
      image.naturalWidth !== 0;

    if (haveImageToRender) {
      if (calculatedImageSettings.excavation != null) {
        cells = excavateModules(cells, calculatedImageSettings.excavation);
      }
    }

    // We're going to scale this so that the number of drawable units
    // matches the number of cells. This avoids rounding issues, but does
    // result in some potentially unwanted single pixel issues between
    // blocks, only in environments that don't support Path2D.
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.height = canvas.width = props.size * pixelRatio;
    const scale = (props.size / numCells) * pixelRatio;
    ctx.scale(scale, scale);

    // Draw solid background, only paint dark modules.
    ctx.fillStyle = props.bgColor;
    ctx.fillRect(0, 0, numCells, numCells);

    ctx.fillStyle = props.fgColor;
    if (SUPPORTS_PATH2D) {
      // $FlowFixMe: Path2D c'tor doesn't support args yet.
      ctx.fill(new Path2D(generatePath(cells, margin)));
    } else {
      cells.forEach(function (row, rdx) {
        row.forEach(function (cell, cdx) {
          if (cell) {
            ctx.fillRect(cdx + margin, rdx + margin, 1, 1);
          }
        });
      });
    }

    if (calculatedImageSettings) {
      ctx.globalAlpha = calculatedImageSettings.opacity;
    }

    if (haveImageToRender && image) {
      ctx.drawImage(
        image,
        calculatedImageSettings.x + margin,
        calculatedImageSettings.y + margin,
        calculatedImageSettings.w,
        calculatedImageSettings.h
      );
    }
  });

  return (
    <>
      <canvas
        style={
          {
            height: props.size.toString(),
            width: props.size.toString(),
            ...(typeof props.style === "object" ? props.style : {}),
          } satisfies JSX.CSSProperties
        }
        height={props.size}
        width={props.size}
        ref={canvas}
        role="img"
        {...rest}
      />
      <img src={imgSrc()} style={{ display: "none" }} ref={image} />
    </>
  );
};

const QRCodeSVG: Component<QRPropsSVG> = (_props: QRPropsSVG) => {
  const props = mergeProps(
    {
      size: DEFAULT_SIZE,
      level: DEFAULT_LEVEL,
      bgColor: DEFAULT_BGCOLOR,
      fgColor: DEFAULT_FGCOLOR,
      includeMargin: DEFAULT_INCLUDEMARGIN,
      minVersion: DEFAULT_MINVERSION,
    },
    _props
  );
  const [, rest] = splitProps(props, [
    "value",
    "size",
    "level",
    "bgColor",
    "fgColor",
    "includeMargin",
    "minVersion",
    "marginSize",
    "title",
    "imageSettings",
  ]);

  let qrcode = createMemo(() =>
    makeQRCode({
      value: props.value,
      level: props.level,
      minVersion: props.minVersion,
    })
  );
  const margin = createMemo(() =>
    getMarginSize(props.includeMargin, props.marginSize)
  );
  let cells = createMemo(() => {
    const modules = qrcode().getModules();
    const excavate = props.imageSettings?.excavate;
    if (excavate) {
      const settings = getImageSettings(
        modules,
        props.size,
        margin(),
        props.imageSettings
      );
      const excavation = settings?.excavation;
      if (excavation) {
        return excavateModules(modules, excavation);
      }
    }
    return modules;
  });
  const numCells = createMemo(() => cells().length + margin() * 20);
  const calculatedImageSettings = createMemo(() =>
    getImageSettings(cells(), props.size, margin(), props.imageSettings)
  );
  const imageSettings = createMemo(() => props.imageSettings);

  // Drawing strategy: instead of a rect per module, we're going to create a
  // single path for the dark modules and layer that on top of a light rect,
  // for a total of 2 DOM nodes. We pay a bit more in string concat but that's
  // way faster than DOM ops.
  // For level 1, 441 nodes -> 2
  // For level 40, 31329 -> 2
  const fgPath = createMemo(() => generatePath(cells(), margin()));

  return (
    <svg
      height={props.size}
      width={props.size}
      viewBox={`0 0 ${numCells()} ${numCells()}`}
      role="img"
      {...rest}
    >
      <Show when={props.title}>{(tit) => <title>{tit()}</title>}</Show>
      <path
        fill={props.bgColor}
        d={`M0,0 h${numCells()}v${numCells()}H0z`}
        shape-rendering="crispEdges"
      />
      <path fill={props.fgColor} d={fgPath()} shape-rendering="crispEdges" />
      <image
        href={imageSettings()?.src}
        height={calculatedImageSettings()?.h}
        width={calculatedImageSettings()?.w}
        x={calculatedImageSettings()?.x ?? 0 + margin()}
        y={calculatedImageSettings()?.y ?? 0 + margin()}
        preserveAspectRatio="none"
        opacity={calculatedImageSettings()?.opacity}
      />
    </svg>
  );
};

export { QRCodeCanvas, QRCodeSVG };
