import "highlight.js/styles/stackoverflow-light.css";
import { Highlight } from "solid-highlight";
import { createMemo, createSignal } from "solid-js";

import { ErrorLevel, QRCodeCanvas, QRCodeSVG } from "../../src";
import "./main.css";

function makeExampleCode(
  componentName: string,
  src: string,
  x: string,
  y: string,
  height: number,
  width: number,
  opacity: number,
  excavate: boolean,
  minVersion: number,
  value: string,
  title: string,
  size: number,
  bgColor: string,
  fgColor: string,
  level: ErrorLevel,
  marginSize: number,
  includeImage: boolean
) {
  const imageSettingsCode = includeImage
    ? `
  imageSettings={{
    src: "${src}",
    x: ${x},
    y: ${y},
    height: ${height},
    width: ${width},
    opacity: ${opacity},
    excavate: ${excavate},
  }}`
    : "";
  const minVersionCode =
    minVersion > 1
      ? `minVersion={${minVersion}}
`
      : "";
  return `import {${componentName}} from 'solid-qr-code';
<${componentName}
  value={"${value}"}
  title={"${title}"}
  size={${size}}
  bgColor={"${bgColor}"}
  fgColor={"${fgColor}"}
  level={"${level}"}
  ${minVersionCode}marginSize={${marginSize}}${imageSettingsCode}
/>`;
}

function FullDemo() {
  const [value, setValue] = createSignal(
    "https://picturesofpeoplescanningqrcodes.tumblr.com/"
  );
  const [size, setSize] = createSignal(128);
  const [fgColor, setFgColor] = createSignal("#000000");
  const [bgColor, setBgColor] = createSignal("#ffffff");
  const [level, setLevel] = createSignal<ErrorLevel>("L");
  const [minVersion, setMinVersion] = createSignal(1);
  const [marginSize, setMarginSize] = createSignal(0);
  const [title, setTitle] = createSignal("Title for my QR Code");
  const [includeImage, setIncludeImage] = createSignal(true);
  const [imageH, setImageH] = createSignal(24);
  const [imageW, setImageW] = createSignal(24);
  const [imageX, setImageX] = createSignal(0);
  const [imageY, setImageY] = createSignal(0);
  const [imageOpacity, setImageOpacity] = createSignal(1);
  const [imageSrc, setImageSrc] = createSignal(
    "https://static.zpao.com/favicon.png"
  );
  const [imageExcavate, setImageExcavate] = createSignal(true);
  const [centerImage, setCenterImage] = createSignal(true);

  const svgCode = createMemo(() =>
    makeExampleCode(
      "QRCodeSVG",
      imageSrc(),
      centerImage() ? "undefined" : imageX().toString(),
      centerImage() ? "undefined" : imageY().toString(),
      imageH(),
      imageW(),
      imageOpacity(),
      imageExcavate(),
      minVersion(),
      value(),
      title(),
      size(),
      bgColor(),
      fgColor(),
      level(),
      marginSize(),
      includeImage()
    )
  );
  const canvasCode = createMemo(() =>
    makeExampleCode(
      "QRCodeCanvas",
      imageSrc(),
      centerImage() ? "undefined" : imageX().toString(),
      centerImage() ? "undefined" : imageY().toString(),
      imageH(),
      imageW(),
      imageOpacity(),
      imageExcavate(),
      minVersion(),
      value(),
      title(),
      size(),
      bgColor(),
      fgColor(),
      level(),
      marginSize(),
      includeImage()
    )
  );

  return (
    <div class="flex flex-row gap-4 p-4">
      <div class="flex flex-col gap-3">
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Size(px):
            <br />
            <input
              type="number"
              class="border p-1"
              onChange={(e) => setSize(parseInt(e.target.value, 10) || 0)}
              value={size()}
            />
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Background Color:
            <br />
            <input
              class="border p-1"
              type="color"
              onChange={(e) => setBgColor(e.target.value)}
              value={bgColor()}
            />
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Foreground Color:
            <br />
            <input
              class="border p-1"
              type="color"
              onChange={(e) => setFgColor(e.target.value)}
              value={fgColor()}
            />
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Error Level:
            <br />
            <select
              onChange={(e) => setLevel(e.target.value as ErrorLevel)}
              value={level()}
            >
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="H">H</option>
            </select>
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Minimum Version: {minVersion()}
            <br />
            <input
              class="border p-1"
              type="range"
              min={1}
              max={40}
              value={minVersion()}
              onChange={(e) => setMinVersion(parseInt(e.target.value, 10))}
            />
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Margin Size:
            <br />
            <input
              class="border p-1"
              type="number"
              step={1}
              value={marginSize()}
              onChange={(e) =>
                setMarginSize(Math.floor(e.target.valueAsNumber))
              }
            />
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Value:
            <br />
            <textarea
              rows={6}
              cols={80}
              onChange={(e) => setValue(e.target.value)}
              value={value()}
            />
          </label>
        </div>
        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Title:
            <br />
            <input
              class="border p-1"
              type="text"
              onChange={(e) => setTitle(e.target.value)}
              value={title()}
            />
          </label>
        </div>

        <div>
          <label class="flex flex-col gap-1.5 w-fit items-start">
            Include Image:
            <br />
            <input
              class="border p-1"
              type="checkbox"
              checked={includeImage()}
              onChange={(e) => setIncludeImage(e.target.checked)}
            />
          </label>
        </div>

        <fieldset disabled={!includeImage}>
          <legend>Image Settings</legend>

          <div>
            <label class="flex flex-col gap-1.5 w-fit items-start">
              Source:
              <br />
              <input
                class="border p-1"
                type="text"
                onChange={(e) => setImageSrc(e.target.value)}
                value={imageSrc()}
              />
            </label>
          </div>
          <div>
            <label class="flex flex-col gap-1.5 w-fit items-start">
              Image Width: {imageW()}
              <br />
              <input
                class="border p-1"
                type="number"
                value={imageW()}
                onChange={(e) => setImageW(parseInt(e.target.value, 10))}
              />
            </label>
          </div>
          <div>
            <label class="flex flex-col gap-1.5 w-fit items-start">
              Image Height: {imageH()}
              <br />
              <input
                class="border p-1"
                type="number"
                value={imageH()}
                onChange={(e) => setImageH(parseInt(e.target.value, 10))}
              />
            </label>
          </div>
          <div>
            <label class="flex flex-col gap-1.5 w-fit items-start">
              Image Opacity: {imageOpacity()}
              <br />
              <input
                class="border p-1"
                type="number"
                value={imageOpacity()}
                step="0.1"
                onChange={(e) => setImageOpacity(Number(e.target.value))}
              />
            </label>
          </div>

          <div>
            <label class="flex flex-col gap-1.5 w-fit items-start">
              Center Image:
              <br />
              <input
                class="border p-1"
                type="checkbox"
                checked={centerImage()}
                onChange={(e) => setCenterImage(e.target.checked)}
              />
            </label>
          </div>
          <fieldset disabled={centerImage()}>
            <legend>Image Settings</legend>
            <div>
              <label class="flex flex-col gap-1.5 w-fit items-start">
                Image X: {imageX()}
                <br />
                <input
                  class="border p-1"
                  type="range"
                  min={0}
                  max={size() - imageW()}
                  value={imageX()}
                  onChange={(e) => setImageX(parseInt(e.target.value, 10))}
                />
              </label>
            </div>
            <div>
              <label class="flex flex-col gap-1.5 w-fit items-start">
                Image Y: {imageY()}
                <br />
                <input
                  class="border p-1"
                  type="range"
                  min={0}
                  max={size() - imageH()}
                  value={imageY()}
                  onChange={(e) => setImageY(parseInt(e.target.value, 10))}
                />
              </label>
            </div>
          </fieldset>
          <div>
            <label class="flex flex-col gap-1.5 w-fit items-start">
              Excavate ("dig" foreground to nearest whole module):
              <br />
              <input
                class="border p-1"
                type="checkbox"
                checked={imageExcavate()}
                onChange={(e) => setImageExcavate(e.target.checked)}
              />
            </label>
          </div>
        </fieldset>
      </div>

      <div class="ml-4">
        <div>
          <h2>
            <pre>QRCodeSVG</pre>
          </h2>
          <Highlight class="text-sm" autoDetect={true}>
            {svgCode()}
          </Highlight>
          <QRCodeSVG
            value={value()}
            title={title()}
            size={size()}
            fgColor={fgColor()}
            bgColor={bgColor()}
            level={level()}
            marginSize={marginSize()}
            minVersion={minVersion()}
            imageSettings={
              includeImage()
                ? {
                    src: imageSrc(),
                    height: imageH(),
                    width: imageW(),
                    x: centerImage() ? undefined : imageX(),
                    y: centerImage() ? undefined : imageY(),
                    excavate: imageExcavate(),
                    opacity: imageOpacity(),
                  }
                : undefined
            }
          />
        </div>

        <div>
          <h2>
            <pre>QRCodeCanvas</pre>
          </h2>
          <Highlight class="text-sm" autoDetect={true}>
            {canvasCode()}
          </Highlight>
          <QRCodeCanvas
            value={value()}
            title={title()}
            size={size()}
            fgColor={fgColor()}
            bgColor={bgColor()}
            level={level()}
            marginSize={marginSize()}
            minVersion={minVersion()}
            imageSettings={
              includeImage()
                ? {
                    src: imageSrc(),
                    height: imageH(),
                    width: imageW(),
                    x: centerImage() ? undefined : imageX(),
                    y: centerImage() ? undefined : imageY(),
                    excavate: imageExcavate(),
                    opacity: imageOpacity(),
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

export default FullDemo;
