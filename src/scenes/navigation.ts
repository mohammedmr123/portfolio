export const MARKET_DESTINATIONS = [
  { id: 'hub', label: 'Hub' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About me' },
  { id: 'articles', label: 'Articles' },
  { id: 'contact', label: 'Contact' },
] as const

export type MarketDestination = (typeof MARKET_DESTINATIONS)[number]['id']

type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  mobilePosition: [number, number, number]
  mobileTarget: [number, number, number]
  mobileFov: number
}

export const CAMERA_POSES: Record<MarketDestination, CameraPose> = {
  hub: {
    position: [0, 5.2, 12],
    target: [0, 1.6, 0],
    fov: 39,
    mobilePosition: [0, 5.2, 13],
    mobileTarget: [0, 1.6, 0],
    mobileFov: 74,
  },
  projects: {
    position: [-10.2, 4.3, 10],
    target: [-10.2, 2.4, 0],
    fov: 48,
    mobilePosition: [-8.95, 3.8, 4.7],
    mobileTarget: [-8.95, 2.6, 0],
    mobileFov: 82,
  },
  about: {
    position: [8.2, 3.4, 4.8],
    target: [8.2, 2.4, -1.5],
    fov: 40,
    mobilePosition: [8.2, 3.4, 4.8],
    mobileTarget: [8.2, 2.5, -1.5],
    mobileFov: 78,
  },
  articles: {
    position: [-5.6, 2.8, 1.6],
    target: [-5.2, 1.35, -3.5],
    fov: 37,
    mobilePosition: [-5.5, 2.7, 2.4],
    mobileTarget: [-5.2, 1.3, -3.5],
    mobileFov: 53,
  },
  contact: {
    position: [5.6, 3.25, 2],
    target: [5.3, 1.8, -3.15],
    fov: 40,
    mobilePosition: [5.5, 2.7, 2.8],
    mobileTarget: [5.3, 1.3, -3.15],
    mobileFov: 53,
  },
}