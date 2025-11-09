import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'

import workspaceSchema from './workspace.schema.ts'

makeWorker({
  schema: workspaceSchema.schema,
  sync: {
    backend: makeWsSync({ url: import.meta.env.VITE_LIVESTORE_SYNC_URL }),
  },
})
