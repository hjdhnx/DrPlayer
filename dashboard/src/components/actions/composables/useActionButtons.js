import { computed } from 'vue'
import { ButtonType, normalizeButtonType } from '../types.js'

export const useActionButtons = (configRef) => {
  const buttonType = computed(() => normalizeButtonType(configRef.value?.button))

  const showOkButton = computed(() => {
    return buttonType.value === ButtonType.OK_CANCEL ||
      buttonType.value === ButtonType.OK_ONLY ||
      buttonType.value === ButtonType.CUSTOM
  })

  const showCancelButton = computed(() => {
    return buttonType.value === ButtonType.OK_CANCEL ||
      buttonType.value === ButtonType.CANCEL_ONLY ||
      buttonType.value === ButtonType.CUSTOM
  })

  const showResetButton = computed(() => buttonType.value === ButtonType.CUSTOM)

  return {
    buttonType,
    showOkButton,
    showCancelButton,
    showResetButton
  }
}
