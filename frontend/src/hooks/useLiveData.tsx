/**
 * Back-compat shim: the live-data provider was replaced by a Zustand store
 * (see src/stores/liveData.ts). These selector hooks re-export the store's, so
 * existing imports (`@/hooks/useLiveData`) keep working.
 */
export {
  useAtis,
  useDatafeed,
  useLiveStatus,
  useLiveFreshness,
  useControllers,
  useMyPosition,
  useLiveStore,
} from '@/stores/liveData'
