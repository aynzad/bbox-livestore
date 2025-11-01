import { storeOptions } from '@livestore/react/experimental'
import projectSchema from './project.schema'

import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import worker from './project.worker?worker'

export const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker,
  sharedWorker: LiveStoreSharedWorker,
})

export const projectStoreOptions = (projectId: string, token: string) =>
  storeOptions({
    storeId: `project-${projectId}`,
    schema: projectSchema.schema,
    syncPayload: { authToken: token },
    adapter,
    gcTime: 20_000,
  })
