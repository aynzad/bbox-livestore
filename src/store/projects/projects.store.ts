import { storeOptions } from '@livestore/react/experimental'
import projectsSchema from './projects.schema'
import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import worker from './projects.worker?worker'

export const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker,
  sharedWorker: LiveStoreSharedWorker,
})

export const projectsStoreOptions = (token: string) =>
  storeOptions({
    storeId: 'projects-root',
    schema: projectsSchema.schema,
    syncPayload: { authToken: token },
    adapter,
    gcTime: Number.POSITIVE_INFINITY, // Disable garbage collection
  })
