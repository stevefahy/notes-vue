/**
 * // useWindowDimension.ts
 * * This returns the viewport/window height and width
 */

import { ref } from 'vue'
import type { Ref } from 'vue'
import APPLICATION_CONSTANTS from '../application-constants/application-constants'
import type { WindowDimensions } from '../model/global'

const useWindowDimensions = (): Ref<WindowDimensions> => {
  const handleResize = (): void => {
    windowDimensions.value.width = window.innerWidth
    windowDimensions.value.height = window.innerHeight
    const viewEl = document.querySelector('#viewnote_id')
    windowDimensions.value.viewnote_width =
      viewEl && viewEl.clientWidth < window.innerWidth
        ? viewEl.clientWidth
        : viewEl
          ? window.innerWidth - APPLICATION_CONSTANTS.VIEWNOTE_PADDING_MOBILE
          : window.innerWidth - APPLICATION_CONSTANTS.VIEWNOTE_PADDING
  }

  const addListener = () => {
    window.addEventListener('resize', handleResize)
  }

  const removeListener = () => {
    window.removeEventListener('resize', handleResize)
  }

  const windowDimensions = ref<WindowDimensions>({
    width: 0,
    height: 0,
    viewnote_width: 0,
    addListener: addListener,
    removeListener: removeListener
  })

  handleResize()

  return windowDimensions
}

export default useWindowDimensions
