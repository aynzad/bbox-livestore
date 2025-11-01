import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'

import projectsSchema from './projects.schema.ts'

makeWorker({
  schema: projectsSchema.schema,
  sync: {
    backend: makeWsSync({ url: import.meta.env.VITE_LIVESTORE_SYNC_URL }),
  },
})
