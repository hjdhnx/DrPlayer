import { onUnmounted, ref } from 'vue'

export const useActionTimeout = (onTimeout) => {
  const timeLeft = ref(0)
  let timer = null

  const stopTimeout = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const startTimeout = (seconds) => {
    stopTimeout()

    const timeout = Number(seconds) || 0
    if (timeout <= 0) {
      timeLeft.value = 0
      return
    }

    timeLeft.value = timeout
    timer = setInterval(() => {
      timeLeft.value -= 1

      if (timeLeft.value <= 0) {
        stopTimeout()
        onTimeout?.()
      }
    }, 1000)
  }

  const restartTimeout = (seconds) => {
    startTimeout(seconds)
  }

  onUnmounted(stopTimeout)

  return {
    timeLeft,
    startTimeout,
    restartTimeout,
    stopTimeout
  }
}
