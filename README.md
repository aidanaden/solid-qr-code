# solid-qr-code

>

[![size](https://img.shields.io/bundlephobia/minzip/solid-qr-code?style=for-the-badge)](https://bundlephobia.com/package/solid-qr-code)
[![size](https://img.shields.io/npm/v/solid-qr-code?style=for-the-badge)](https://www.npmjs.com/package/solid-qr-code)
![npm](https://img.shields.io/npm/dw/solid-qr-code?style=for-the-badge)

[download-image]: https://img.shields.io/npm/dm/solid-qr-code.svg
[download-url]: https://npmjs.org/package/solid-qr-code

[![solid-qr-code](https://nodei.co/npm/solid-qr-code.png)](https://npmjs.org/package/solid-qr-code)

A Solid component to generate [QR codes](http://en.wikipedia.org/wiki/QR_code) for rendering to the DOM. This package was ported to Solid from the [qrcode.react](https://github.com/zpao/qrcode.react) package made by [zpao](https://github.com/zpao)

## Installation

```sh
npm install solid-qr-code
```

## Usage

`solid-qr-code` exports three components, supporting rendering as SVG or Canvas. SVG is generally recommended as it is more flexible, but Canvas may be preferable.

All examples are shown using modern JavaScript modules and syntax.

### `QRCodeSVG`

```js
import { render } from 'solid-js/web';
import QRCodeSVG from "solid-qr-code";

import App from './App';

render(() => <QRCodeSVG value="https://solidjs.com/" />, document.getElementById('root') as HTMLElement);
```

### `QRCodeCanvas`

```js
import { render } from 'solid-js/web';
import QRCodeCanvas from "solid-qr-code";

import App from './App';

render(() => <QRCodeCanvas value="https://solidjs.com/" />, document.getElementById('root') as HTMLElement);
```

### `QRCode` - **DEPRECATED**

**Note:** Usage of this is deprecated as of v3. It is available as the `default` export for compatiblity with previous versions. The `renderAs` prop is only supported with this component.

```js
import { render } from 'solid-js/web';
import QRCode from "solid-qr-code";

import App from './App';

render(() => <QRCode value="https://solidjs.com/" renderAs="canvas" />, document.getElementById('root') as HTMLElement);
```

## Available Props

| prop            | type                         | default value |
| --------------- | ---------------------------- | ------------- |
| `value`         | `string`                     |
| `renderAs`      | `string` (`'canvas' 'svg'`)  | `'canvas'`    |
| `size`          | `number`                     | `128`         |
| `bgColor`       | `string` (CSS color)         | `"#FFFFFF"`   |
| `fgColor`       | `string` (CSS color)         | `"#000000"`   |
| `level`         | `string` (`'L' 'M' 'Q' 'H'`) | `'L'`         |
| `includeMargin` | `boolean`                    | `false`       |
| `imageSettings` | `object` (see below)         |               |

### `imageSettings`

| field    | type     | default value     |
| -------- | -------- | ----------------- |
| `src`    | `string` |
| `x`      | `number` | none, will center |
| `y`      | `number` | none, will center |
| `height` | `number` | 10% of `size`     |
| `width`  | `number` | 10% of `size`     |

## Custom Styles

`solid-qr-code` will pass through any additional props to the underlying DOM node (`<svg>` or `<canvas>`). This allows the use of inline `style` or custom `className` to customize the rendering. One common use would be to support a responsive layout.

**Note:** In order to render QR Codes in `<canvas>` on high density displays, we scale the canvas element to contain an appropriate number of pixels and then use inline styles to scale back down. We will merge any additional styles, with custom `height` and `width` overriding our own values. This allows scaling to percentages _but_ if scaling beyond the `size`, you will encounter blurry images. I recommend detecting resizes with something like a solid version of [react-measure](https://github.com/souporserious/react-measure) to detect and pass the appropriate size when rendering to `<canvas>`.

<img src="qrcode.png" height="256" width="256">

## Encoding Mode

`solid-qr-code` supports encoding text only, in a single segment. The encoding library being used does minimal detection to determine if the text being encoded can follow an optimized path for Numeric or Alphanumeric modes, allowing for more data to be encoded. Otherwise, it will encode following Byte mode. This mode includes supports multi-byte Unicode characters such as Kanji, however it does not support the optimized Kanji encoding mode.

## LICENSE

`solid-qr-code` is licensed under the [MIT license](LICENSE).

`solid-qr-code` bundles [QR Code Generator](https://www.nayuki.io/page/qr-code-generator-library), which is available under the [MIT license](src/third-party/qrcodegen/LICENSE).
