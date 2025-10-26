import {
  Events,
  makeSchema,
  Schema,
  SessionIdSymbol,
  State,
} from '@livestore/livestore'

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
export const tables = {
  projects: State.SQLite.table({
    name: 'projects',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({ default: '' }),
      deletedAt: State.SQLite.integer({
        nullable: true,
        schema: Schema.DateFromNumber,
      }),
    },
  }),
  bboxes: State.SQLite.table({
    name: 'bboxes',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      projectId: State.SQLite.text(),
      x: State.SQLite.real(),
      y: State.SQLite.real(),
      width: State.SQLite.real(),
      height: State.SQLite.real(),
      createdAt: State.SQLite.integer({
        schema: Schema.DateFromNumber,
      }),
      updatedAt: State.SQLite.integer({
        schema: Schema.DateFromNumber,
      }),
      deletedAt: State.SQLite.integer({
        nullable: true,
        schema: Schema.DateFromNumber,
      }),
    },
  }),
  // Client documents can be used for local-only state (e.g. form inputs)
  uiState: State.SQLite.clientDocument({
    name: 'uiState',
    schema: Schema.Struct({
      newTodoText: Schema.String,
      filter: Schema.Literal('all', 'active', 'completed'),
    }),
    default: { id: SessionIdSymbol, value: { newTodoText: '', filter: 'all' } },
  }),
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
export const events = {
  projectCreated: Events.synced({
    name: 'v1.ProjectCreated',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
    }),
  }),
  projectUpdated: Events.synced({
    name: 'v1.ProjectUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
    }),
  }),
  projectDeleted: Events.synced({
    name: 'v1.ProjectDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
  bboxCreated: Events.synced({
    name: 'v1.BboxCreated',
    schema: Schema.Struct({
      id: Schema.String,
      projectId: Schema.String,
      x: Schema.Number,
      y: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
      createdAt: Schema.Date,
      updatedAt: Schema.Date,
    }),
  }),
  bboxUpdated: Events.synced({
    name: 'v1.BboxUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      x: Schema.Number,
      y: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
      updatedAt: Schema.Date,
    }),
  }),
  bboxDeleted: Events.synced({
    name: 'v1.BboxDeleted',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),

  uiStateSet: tables.uiState.set,
}

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
  'v1.ProjectCreated': ({ id, name }) => tables.projects.insert({ id, name }),
  'v1.ProjectUpdated': ({ id, name }) =>
    tables.projects.update({ name }).where({ id }),
  'v1.ProjectDeleted': ({ id, deletedAt }) =>
    tables.projects.update({ deletedAt }).where({ id }),
  'v1.BboxCreated': ({
    id,
    projectId,
    x,
    y,
    width,
    height,
    createdAt,
    updatedAt,
  }) =>
    tables.bboxes.insert({
      id,
      projectId,
      x,
      y,
      width,
      height,
      createdAt,
      updatedAt,
    }),
  'v1.BboxUpdated': ({ id, x, y, width, height, updatedAt }) =>
    tables.bboxes.update({ x, y, width, height, updatedAt }).where({ id }),
  'v1.BboxDeleted': ({ id, deletedAt }) =>
    tables.bboxes.update({ deletedAt }).where({ id }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
