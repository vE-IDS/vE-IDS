/** Time formatting helpers (ported from the old app). */

/** Local `HH:MM:SS`. */
export const formatDate = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

/** UTC `HH:MMZ`. */
export const formatDateToZ = (date: Date): string =>
  `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}Z`

/** UTC `HH:MM:SS`. */
export const formatTimeZulu = (date: Date): string =>
  `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`

/** Local `HH:MM:SS`. */
export const formatTimeLocal = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

const pad = (n: number) => n.toString().padStart(2, '0')
