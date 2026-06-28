
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: number | null = null

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (...args: any[]) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      // eslint-disable-next-line prefer-spread
      fn.apply(null, args)
    }, delay)
  }
}