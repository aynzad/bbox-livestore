import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'

import projectSchema from './project.schema.ts'

makeWorker({
  schema: projectSchema.schema,
  sync: {
    backend: makeWsSync({ url: import.meta.env.VITE_LIVESTORE_SYNC_URL }),
  },
})
