import {
  Events,
  makeSchema,
  Schema,
  SessionIdSymbol,
  State,
} from '@livestore/livestore'

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
const tables = {
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
  users: State.SQLite.table({
    name: 'users',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({ default: '' }),
      email: State.SQLite.text({ default: '' }),
    },
  }),
  projectsUsers: State.SQLite.table({
    name: 'projects_users',
    columns: {
      userId: State.SQLite.text({ default: '' }),
      projectId: State.SQLite.text({ default: '' }),
      isAdmin: State.SQLite.boolean({ default: false }),
    },
    indexes: [
      {
        name: 'idx_user_project',
        columns: ['userId', 'projectId'],
      },
    ],
  }),
  // Client documents can be used for local-only state (e.g. form inputs)
  uiState: State.SQLite.clientDocument({
    name: 'uiState',
    schema: Schema.Struct({
      searchQuery: Schema.String,
    }),
    default: { id: SessionIdSymbol, value: { searchQuery: '' } },
  }),
}

// Events describe data changes (https://docs.livestore.dev/reference/events)
const events = {
  createProject: Events.synced({
    name: 'v1.createProject',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      userId: Schema.String,
      collaborators: Schema.Array(Schema.String),
    }),
  }),
  updateProject: Events.synced({
    name: 'v1.updateProject',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
    }),
  }),
  deleteProject: Events.synced({
    name: 'v1.deleteProject',
    schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
  }),
  createUser: Events.synced({
    name: 'v1.createUser',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      email: Schema.String,
    }),
  }),
  updateUser: Events.synced({
    name: 'v1.updateUser',
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      email: Schema.String,
    }),
  }),
  addUserToProject: Events.synced({
    name: 'v1.addUserToProject',
    schema: Schema.Struct({
      userId: Schema.String,
      projectId: Schema.String,
      isAdmin: Schema.Boolean,
    }),
  }),
  removeUserFromProject: Events.synced({
    name: 'v1.removeUserFromProject',
    schema: Schema.Struct({
      userId: Schema.String,
      projectId: Schema.String,
    }),
  }),
  uiStateSet: tables.uiState.set,
}

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
  'v1.createProject': ({ id, name, userId, collaborators }) => {
    const projectInsert = tables.projects.insert({ id, name })
    const adminInsert = tables.projectsUsers.insert({
      userId,
      projectId: id,
      isAdmin: true,
    })
    const collaboratorsInsert = collaborators.map((collaboratorId) =>
      tables.projectsUsers.insert({
        userId: collaboratorId,
        projectId: id,
        isAdmin: false,
      }),
    )

    return [projectInsert, adminInsert, ...collaboratorsInsert]
  },
  'v1.updateProject': ({ id, name }) =>
    tables.projects.update({ name }).where({ id }),
  'v1.deleteProject': ({ id, deletedAt }) =>
    tables.projects.update({ deletedAt }).where({ id }),
  'v1.createUser': ({ id, name, email }) =>
    tables.users.insert({ id, name, email }).onConflict('id', 'replace'),
  'v1.updateUser': ({ id, name, email }) =>
    tables.users.update({ name, email }).where({ id }),
  'v1.addUserToProject': ({ userId, projectId, isAdmin }) =>
    tables.projectsUsers.insert({ userId, projectId, isAdmin }),
  'v1.removeUserFromProject': ({ userId, projectId }) =>
    tables.projectsUsers.delete().where({ userId, projectId }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })

export default {
  tables,
  events,
  schema,
}
