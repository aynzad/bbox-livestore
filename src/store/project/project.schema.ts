import { Events, makeSchema, Schema, State } from '@livestore/livestore'

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
const tables = {
  bboxes: State.SQLite.table({
    name: 'bboxes',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
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
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
const events = {
  createBbox: Events.synced({
    name: 'v1.CreateBbox',
    schema: Schema.Struct({
      id: Schema.String,
      x: Schema.Number,
      y: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
      createdAt: Schema.Date,
      updatedAt: Schema.Date,
    }),
  }),
  updateBbox: Events.synced({
    name: 'v1.UpdateBbox',
    schema: Schema.Struct({
      id: Schema.String,
      x: Schema.Number,
      y: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
      updatedAt: Schema.Date,
    }),
  }),
  deleteBbox: Events.synced({
    name: 'v1.DeleteBbox',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
}

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
  'v1.CreateBbox': ({ id, x, y, width, height, createdAt, updatedAt }) =>
    tables.bboxes.insert({
      id,
      x,
      y,
      width,
      height,
      createdAt,
      updatedAt,
    }),
  'v1.UpdateBbox': ({ id, x, y, width, height, updatedAt }) =>
    tables.bboxes.update({ x, y, width, height, updatedAt }).where({ id }),
  'v1.DeleteBbox': ({ id, deletedAt }) =>
    tables.bboxes.update({ deletedAt }).where({ id }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })

export default {
  tables,
  events,
  schema,
}
