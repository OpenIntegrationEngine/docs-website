import DefaultTheme from 'vitepress/theme'
import {inBrowser, type Theme} from 'vitepress'
import './custom.css'

// Screenshots in a page; badges and other images from elsewhere are left alone.
const SCREENSHOT = '.vp-doc img:not([src^="http"])'

// Shows the image at full size over the page. A click anywhere or Escape closes it.
function zoom(img: HTMLImageElement) {
  const overlay = document.createElement('div')
  overlay.className = 'img-zoom'
  const large = document.createElement('img')
  large.src = img.currentSrc || img.src
  large.alt = img.alt
  overlay.appendChild(large)

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
  }
  const close = () => {
    overlay.remove()
    document.removeEventListener('keydown', onKey)
  }
  overlay.addEventListener('click', close)
  document.addEventListener('keydown', onKey)
  document.body.appendChild(overlay)
}

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (!inBrowser) return
    document.addEventListener('click', (e) => {
      const img = e.target instanceof HTMLImageElement ? e.target : null
      if (img?.matches(SCREENSHOT) && !img.closest('a')) zoom(img)
    })
  }
} satisfies Theme
