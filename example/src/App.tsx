import { Component, createSignal } from "solid-js";
import SolidHighlight from "solid-highlight";
import "highlight.js/styles/stackoverflow-light.css";
import "./index.css";

import { QRCodeSVG, QRCodeCanvas } from "../../src";

const App: Component = () => {
  const [value, setValue] = createSignal(
    "https://picturesofpeoplescanningqrcodes.tumblr.com/"
  );
  const [size, setSize] = createSignal(128);
  const [fgColor, setFgColor] = createSignal("#000000");
  const [bgColor, setBgColor] = createSignal("#ffffff");
  const [level, setLevel] = createSignal("L");
  const [includeMargin, setIncludeMargin] = createSignal(false);
  const [includeImage, setIncludeImage] = createSignal(true);
  const [imageH, setImageH] = createSignal(24);
  const [imageW, setImageW] = createSignal(24);
  const [imageX, setImageX] = createSignal(0);
  const [imageY, setImageY] = createSignal(0);
  const [imageSrc, setImageSrc] = createSignal(
    "https://static.zpao.com/favicon.png"
  );
  const [imageExcavate, setImageExcavate] = createSignal(true);
  const [centerImage, setCenterImage] = createSignal(true);

  function makeExampleCode(componentName: string) {
    const imageSettingsCode = includeImage()
      ? `
  imageSettings={{
    src: "${imageSrc()}",
    x: ${centerImage() ? "undefined" : imageX()},
    y: ${centerImage() ? "undefined" : imageY()},
    height: ${imageH()},
    width: ${imageW()},
    excavate: ${imageExcavate()},
  }}`
      : "";
    return `import {${componentName}} from 'qrcode.react';
    
<${componentName}
  value={"${value()}"}
  size={${size()}}
  bgColor={"${bgColor()}"}
  fgColor={"${fgColor()}"}
  level={"${level()}"}
  includeMargin={${includeMargin()}}${imageSettingsCode}
/>`;
  }
  const svgCode = makeExampleCode("QRCodeSVG");
  const canvasCode = makeExampleCode("QRCodeCanvas");

  return (
    <>
      <h1>
        solid-qr-code Demo -{" "}
        {/* <a href={`https://www.npmjs.com/package/qrcode.react/v/${version}`}>
          v{version}
        </a> */}
      </h1>
      <div class="container">
        <div class="form">
          <div>
            <label>
              Size(px):
              <br />
              <input
                type="number"
                onChange={(e: any) =>
                  setSize(parseInt(e.target.value, 10) || 0)
                }
                value={size()}
              />
            </label>
          </div>
          <div>
            <label>
              Background Color:
              <br />
              <input
                type="color"
                onChange={(e: any) => setBgColor(e.target.value)}
                value={bgColor()}
              />
            </label>
          </div>
          <div>
            <label>
              Foreground Color:
              <br />
              <input
                type="color"
                onChange={(e: any) => setFgColor(e.target.value)}
                value={fgColor()}
              />
            </label>
          </div>
          <div>
            <label>
              Error Level:
              <br />
              <select
                onChange={(e: any) => setLevel(e.target.value)}
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
            <label>
              Include Margin:
              <br />
              <input
                type="checkbox"
                checked={includeMargin()}
                onChange={(e: any) => setIncludeMargin(e.target.checked)}
              />
            </label>
          </div>
          <div>
            <label>
              Value:
              <br />
              <textarea
                rows={6}
                cols={80}
                onChange={(e: any) => setValue(e.target.value)}
                value={value()}
              />
            </label>
          </div>

          <div>
            <label>
              Include Image:
              <br />
              <input
                type="checkbox"
                checked={includeImage()}
                onChange={(e: any) => setIncludeImage(e.target.checked)}
              />
            </label>
          </div>

          <fieldset disabled={!includeImage()}>
            <legend>Image Settings</legend>

            <div>
              <label>
                Source:
                <br />
                <input
                  type="text"
                  onChange={(e: any) => setImageSrc(e.target.value)}
                  value={imageSrc()}
                />
              </label>
            </div>
            <div>
              <label>
                Image Width: {imageW()}
                <br />
                <input
                  type="number"
                  value={imageW()}
                  onChange={(e: any) => setImageW(parseInt(e.target.value, 10))}
                />
              </label>
            </div>
            <div>
              <label>
                Image Height: {imageH()}
                <br />
                <input
                  type="number"
                  value={imageH()}
                  onChange={(e: any) => setImageH(parseInt(e.target.value, 10))}
                />
              </label>
            </div>

            <div>
              <label>
                Center Image:
                <br />
                <input
                  type="checkbox"
                  checked={centerImage()}
                  onChange={(e: any) => setCenterImage(e.target.checked)}
                />
              </label>
            </div>
            <fieldset disabled={centerImage()}>
              <legend>Image Settings</legend>
              <div>
                <label>
                  Image X: {imageX()}
                  <br />
                  <input
                    type="range"
                    min={0}
                    max={size() - imageW()}
                    value={imageX()}
                    onChange={(e: any) =>
                      setImageX(parseInt(e.target.value, 10))
                    }
                  />
                </label>
              </div>
              <div>
                <label>
                  Image Y: {imageY()}
                  <br />
                  <input
                    type="range"
                    min={0}
                    max={size() - imageH()}
                    value={imageY()}
                    onChange={(e: any) =>
                      setImageY(parseInt(e.target.value, 10))
                    }
                  />
                </label>
              </div>
            </fieldset>
            <div>
              <label>
                Excavate ("dig" foreground to nearest whole module):
                <br />
                <input
                  type="checkbox"
                  checked={imageExcavate()}
                  onChange={(e: any) => setImageExcavate(e.target.checked)}
                />
              </label>
            </div>
          </fieldset>
        </div>

        <div class="output">
          <div>
            <h2>
              <pre>QRCodeSVG</pre>
            </h2>
            <div>
              <SolidHighlight language="javascript" autoDetect={false}>
                {svgCode}
              </SolidHighlight>
            </div>

            <QRCodeSVG
              value={value()}
              size={size()}
              fgColor={fgColor()}
              bgColor={bgColor()}
              level={level()}
              includeMargin={includeMargin()}
              imageSettings={
                includeImage()
                  ? {
                      src: imageSrc(),
                      height: imageH(),
                      width: imageW(),
                      x: centerImage() ? undefined : imageX(),
                      y: centerImage() ? undefined : imageY(),
                      excavate: imageExcavate(),
                    }
                  : undefined
              }
            />
          </div>

          <div>
            <h2>
              <pre>QRCodeCanvas</pre>
            </h2>
            <div>
              <SolidHighlight language="javascript" autoDetect={false}>
                {canvasCode}
              </SolidHighlight>
            </div>
            <QRCodeCanvas
              value={value()}
              size={size()}
              fgColor={fgColor()}
              bgColor={bgColor()}
              level={level()}
              includeMargin={includeMargin()}
              imageSettings={
                includeImage()
                  ? {
                      src: imageSrc(),
                      height: imageH(),
                      width: imageW(),
                      x: centerImage() ? undefined : imageX(),
                      y: centerImage() ? undefined : imageY(),
                      excavate: imageExcavate(),
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
