import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: {
    singular: 'Utilizador',
    plural: 'Utilizadores',
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
