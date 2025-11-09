import { storeOptions } from '@livestore/react/experimental'
import workspaceSchema from './workspace.schema'
import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import worker from './workspace.worker?worker'

export const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker,
  sharedWorker: LiveStoreSharedWorker,
})

export const workspaceStoreOptions = (token: string) =>
  storeOptions({
    storeId: 'workspace',
    schema: workspaceSchema.schema,
    syncPayload: { authToken: token },
    adapter,
    gcTime: Number.POSITIVE_INFINITY, // Disable garbage collection
  })
