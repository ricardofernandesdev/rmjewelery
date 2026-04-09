import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: any }) => Boolean(req.user)
const isSelfOrAdmin = ({ req, id }: { req: any; id?: string | number }) => {
  if (!req.user) return false
  if (String(req.user.id) === String(id)) return true
  return true // all authenticated users are admins for now
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 min lockout after 5 failed attempts
  },
  labels: {
    singular: 'Utilizador',
    plural: 'Utilizadores',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isSelfOrAdmin,
    delete: isAdmin,
    admin: isAdmin,
  },
  admin: {
    useAsTitle: 'email',
    components: {
      views: {
        list: {
          Component: './src/components/admin/CollectionList#UsersList',
        },
        edit: {
          default: {
            Component: './src/components/admin/UserEdit#UserEdit',
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Foto de Perfil',
    },
  ],
}
