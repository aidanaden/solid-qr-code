import {
  createEffect,
  createSignal,
  JSX,
  mergeProps,
  splitProps,
  on,
  createMemo,
  Show,
} from "solid-js";
import qrcodegen from "./third-party/qrcodegen";

type Modules = ReturnType<qrcodegen.QrCode["getModules"]>;

const ERROR_LEVEL_MAP: { [index: string]: qrcodegen.QrCode.Ecc } = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
};

type ImageSettings = {
  src: string;
  height: number;
  width: number;
  x?: number;
  y?: number;
};

export type QRProps = {
  value: string;
  size?: number;
  // Should be a real enum, but doesn't seem to be compatible with real code.
  level?: string;
  bgColor?: string;
  fgColor?: string;
  style?: JSX.CSSProperties;
  includeMargin?: boolean;
  imageSettings?: ImageSettings;
};
type QRPropsCanvas = QRProps & JSX.CanvasHTMLAttributes<HTMLCanvasElement>;
// type QRPropsSVG = QRProps & React.SVGProps<SVGSVGElement>;
type QRPropsSVG = QRProps & JSX.SvgSVGAttributes<SVGSVGElement>;

const DEFAULT_SIZE = 128;
const DEFAULT_LEVEL = "L";
const DEFAULT_BGCOLOR = "#FFFFFF";
const DEFAULT_FGCOLOR = "#000000";
const DEFAULT_INCLUDEMARGIN = false;

const MARGIN_SIZE = 4;

// This is *very* rough estimate of max amount of QRCode allowed to be covered.
// It is "wrong" in a lot of ways (area is a terrible way to estimate, it
// really should be number of modules covered), but if for some reason we don't
// get an explicit height or width, I'd rather default to something than throw.
const DEFAULT_IMG_SCALE = 0.1;

function generatePath(modules: Modules, margin: number = 0): string {
  const ops: Array<string> = [];
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

type ImageSettingsProps = {
  cells: Modules;
  size: number;
  includeMargin: boolean;
  imageSettings?: ImageSettings;
};

function getImageSettings(props: ImageSettingsProps): null | {
  x: number;
  y: number;
  h: number;
  w: number;
} {
  if (props.imageSettings == null) {
    return null;
  }
  const margin = props.includeMargin ? MARGIN_SIZE : 0;
  const numCells = props.cells.length + margin * 2;
  const defaultSize = Math.floor(props.size * DEFAULT_IMG_SCALE);
  const scale = numCells / props.size;
  const w = (props.imageSettings.width || defaultSize) * scale;
  const h = (props.imageSettings.height || defaultSize) * scale;
  const x =
    props.imageSettings.x == null
      ? props.cells.length / 2 - w / 2
      : props.imageSettings.x * scale;
  const y =
    props.imageSettings.y == null
      ? props.cells.length / 2 - h / 2
      : props.imageSettings.y * scale;

  return { x, y, h, w };
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

function QRCodeCanvas(_props: QRPropsCanvas) {
  const defaultProps = {
    size: DEFAULT_SIZE,
    level: DEFAULT_LEVEL,
    bgColor: DEFAULT_BGCOLOR,
    fgColor: DEFAULT_FGCOLOR,
    includeMargin: DEFAULT_INCLUDEMARGIN,
  };
  const props = mergeProps(defaultProps, _props);
  const [local, others] = splitProps(props, [
    "size",
    "level",
    "bgColor",
    "fgColor",
    "includeMargin",
  ]);
  const imgSrc = createMemo(() =>
    others.imageSettings ? others.imageSettings.src : ""
  );
  let canvas: HTMLCanvasElement;
  let image: HTMLImageElement;

  // We're just using this state to trigger rerenders when images load. We
  // Don't actually read the value anywhere. A smarter use of useEffect would
  // depend on this value.
  const [isImgLoaded, setIsImageLoaded] = createSignal(false);

  createEffect(() => {
    // Always update the canvas. It's cheap enough and we want to be correct
    // with the current state.
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!ctx) {
        return;
      }

      if (!isImgLoaded()) {
        return;
      }

      let cells = createMemo(() =>
        qrcodegen.QrCode.encodeText(
          others.value,
          ERROR_LEVEL_MAP[local.level]
        ).getModules()
      );

      const margin = createMemo(() => (local.includeMargin ? MARGIN_SIZE : 0));
      const numCells = createMemo(() => cells().length + margin() * 2);
      const calculatedImageSettings = createMemo(() =>
        getImageSettings({
          cells: cells(),
          size: local.size,
          includeMargin: local.includeMargin,
          imageSettings: others.imageSettings,
        })
      );

      const haveImageToRender =
        calculatedImageSettings() != null &&
        image !== null &&
        image.complete &&
        image.naturalHeight !== 0 &&
        image.naturalWidth !== 0;

      // We're going to scale this so that the number of drawable units
      // matches the number of cells. This avoids rounding issues, but does
      // result in some potentially unwanted single pixel issues between
      // blocks, only in environments that don't support Path2D.
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.height = canvas.width = local.size * pixelRatio;
      const scale = (local.size / numCells()) * pixelRatio;
      ctx.scale(scale, scale);

      // Draw solid background, only paint dark modules.
      ctx.fillStyle = local.bgColor;
      ctx.fillRect(0, 0, numCells(), numCells());

      ctx.fillStyle = local.fgColor;
      if (SUPPORTS_PATH2D) {
        // $FlowFixMe: Path2D c'tor doesn't support args yet.
        ctx.fill(new Path2D(generatePath(cells(), margin())));
      } else {
        cells().forEach(function (row, rdx) {
          row.forEach(function (cell, cdx) {
            if (cell) {
              ctx.fillRect(cdx + margin(), rdx + margin(), 1, 1);
            }
          });
        });
      }

      if (haveImageToRender) {
        ctx.drawImage(
          image,
          calculatedImageSettings().x + margin(),
          calculatedImageSettings().y + margin(),
          calculatedImageSettings().w,
          calculatedImageSettings().h
        );
      }
    }
  });

  // Ensure we mark image loaded as false here so we trigger updating the
  // canvas in our other effect.
  createEffect(
    on(imgSrc, (imgSrc) => {
      if (imgSrc) {
        setIsImageLoaded(false);
      }
    })
  );

  return (
    <>
      <canvas
        style={{ height: local.size, width: local.size, ...others }}
        height={local.size}
        width={local.size}
        ref={canvas}
        {...others}
      />
      <Show when={imgSrc()}>
        <img
          src={imgSrc()}
          style={{ display: "none" }}
          onLoad={() => {
            setIsImageLoaded(true);
          }}
          ref={image}
        />
      </Show>
    </>
  );
}

function QRCodeSVG(_props: QRPropsSVG) {
  const defaultProps = {
    size: DEFAULT_SIZE,
    level: DEFAULT_LEVEL,
    bgColor: DEFAULT_BGCOLOR,
    fgColor: DEFAULT_FGCOLOR,
    includeMargin: DEFAULT_INCLUDEMARGIN,
  };
  const props = mergeProps(defaultProps, _props);
  const [local, others] = splitProps(props, [
    "size",
    "level",
    "bgColor",
    "fgColor",
    "includeMargin",
  ]);
  let cells = createMemo(() => {
    const error = ERROR_LEVEL_MAP[local.level];
    return qrcodegen.QrCode.encodeText(others.value, error).getModules();
  });

  const margin = createMemo(() => (local.includeMargin ? MARGIN_SIZE : 0));
  const numCells = createMemo(() => cells().length + margin() * 2);
  const calculatedImageSettings = createMemo(() =>
    getImageSettings({
      cells: cells(),
      size: local.size,
      includeMargin: local.includeMargin,
      imageSettings: others.imageSettings,
    })
  );

  // Drawing strategy: instead of a rect per module, we're going to create a
  // single path for the dark modules and layer that on top of a light rect,
  // for a total of 2 DOM nodes. We pay a bit more in string concat but that's
  // way faster than DOM ops.
  // For level 1, 441 nodes -> 2
  // For level 40, 31329 -> 2
  const fgPath = createMemo(() => generatePath(cells(), margin()));

  return (
    <svg
      height={local.size}
      width={local.size}
      viewBox={`0 0 ${numCells()} ${numCells()}`}
      {...others}
    >
      <path
        fill={local.bgColor}
        d={`M0,0 h${numCells()}v${numCells()}H0z`}
        shape-rendering="crispEdges"
      />
      <path fill={local.fgColor} d={fgPath()} shape-rendering="crispEdges" />
      <Show when={others.imageSettings && calculatedImageSettings()}>
        <image
          href={others.imageSettings ? others.imageSettings.src : ""}
          height={calculatedImageSettings().h}
          width={calculatedImageSettings().w}
          x={calculatedImageSettings().x + margin()}
          y={calculatedImageSettings().y + margin()}
          preserveAspectRatio="none"
        />
      </Show>
    </svg>
  );
}

type RootProps =
  | (QRPropsSVG & { renderAs: "svg" })
  | (QRPropsCanvas & { renderAs?: "canvas" });
const QRCode = (_props: RootProps) => {
  const [local, others] = splitProps(_props, ["renderAs"]);
  if (local.renderAs === "svg") {
    return <QRCodeSVG {...(others as QRPropsSVG)} />;
  }
  return <QRCodeCanvas {...(others as QRPropsCanvas)} />;
};

export { QRCode as default, QRCodeCanvas, QRCodeSVG };
