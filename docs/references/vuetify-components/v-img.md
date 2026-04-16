# VImg
Source: packages/vuetify/src/components/VImg/VImg.tsx

Responsive image component with lazy loading, placeholder, error handling, and gradient overlay. Wraps VResponsive for aspect ratio control.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| src | string \| srcObject | Image source URL | -- |
| srcset | string | Responsive image srcset | -- |
| lazySrc | string | Low-res placeholder shown during load (blurred) | -- |
| sizes | string | Responsive sizes attribute | -- |
| cover | boolean | `object-fit: cover` (default: contain) | -- |
| position | string | `object-position` on the img element | -- |
| aspectRatio | string \| number | Aspect ratio via VResponsive (e.g., "16/9") | -- |
| width | string \| number | Container width; "auto" uses natural width; "fit-content" wraps | -- |
| height | string \| number | Container height | -- |
| maxWidth | string \| number | Max width via VResponsive | -- |
| maxHeight | string \| number | Max height via VResponsive | -- |
| rounded | boolean \| string \| number | Border radius via `useRounded` | -- |
| color | string | Background color shown during load via `useBackgroundColor` | -- |
| gradient | string | CSS linear-gradient overlay (e.g., "to top, rgba(0,0,0,.5), transparent") | -- |
| alt | string | Alt text; also sets `aria-label` and `role="img"` | -- |
| eager | boolean | Skip lazy loading; load immediately | -- |
| absolute | boolean | Position absolute + 100% width/height; used as background | -- |
| transition | string | Transition for image reveal | -- |
| crossorigin | string | CORS policy ("anonymous" \| "use-credentials") | -- |
| draggable | boolean \| string | HTML draggable attribute | -- |

## Slot Anatomy
- **default**: Overlaid content on top of the image (via VResponsive)
- **placeholder**: Shown during loading state (e.g., VSkeletonLoader, VProgressCircular)
- **error**: Shown when image fails to load
- **sources**: `<source>` elements for `<picture>` element

## Composable Hooks
- **useBackgroundColor**: Background color during loading
- **useRounded**: Border radius classes
- **VResponsive**: Aspect ratio, dimensions
- **vIntersect**: IntersectionObserver for lazy loading
- **MaybeTransition**: Image reveal animation

## SASS Hooks
- `$img-rounded-border-radius`: settings.$border-radius-root
- `$img-preload-filter`: blur(4px) -- lazy src blur
- `.v-img__img--cover`: object-fit: cover
- `.v-img__img--contain`: object-fit: contain
- `.v-img--absolute`: position absolute, 100% fill, z-index: -1
- `.v-img--fit-content`: max-width: fit-content, relative img position
- `.v-img--booting .v-responsive__sizer`: transition: none (prevents flash)
- `.v-img__gradient`: Gradient overlay div

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Hero/cover image | `<VImg src="url" cover height="300" />` |
| Thumbnail with aspect ratio | `<VImg src="url" aspect-ratio="1" width="80" />` |
| Card media image | `<VImg src="url" cover />` inside VCard |
| Gradient text overlay | `gradient="to top, rgba(0,0,0,.7), transparent"` + default slot |
| Rounded image | `rounded="lg"` or `rounded` |
| Lazy-loaded image | Default behavior; add `lazy-src="thumb.jpg"` for blur-up |
| Background image | `absolute` prop inside a relative container |
| Loading placeholder | `#placeholder` slot with VProgressCircular |
| Error fallback | `#error` slot with fallback icon/text |
| Responsive srcset | `srcset="img-300.jpg 300w, img-600.jpg 600w" sizes="(max-width: 600px) 300px, 600px"` |
