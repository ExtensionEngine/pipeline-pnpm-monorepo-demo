import 'dotenv/config';

import * as pulumi from '@pulumi/pulumi';
import * as z from 'zod';

type ContainerConfig = {
  port: number;
  imageRepo: string;
};

type DbConfig = {
  name: string;
  user: string;
};

const Schema = z
  .object({
    container: z.object({
      port: z.number().int(),
      imageRepo: z.string().regex(/^([a-zA-Z0-9.:/_-]+)$/),
      imageTag: z.string().regex(/^([a-zA-Z0-9._-]+)$/),
    }),
    db: z.object({
      name: z.string().nonempty(),
      user: z.string().nonempty(),
    }),
  })
  .transform(({ container: { imageRepo, ...containerProps }, ...props }) => ({
    ...props,
    container: {
      ...containerProps,
      imageRef: `${imageRepo}:${containerProps.imageTag}`,
    },
  }));

const config = new pulumi.Config('infra');
const containerConfig = config.getObject<ContainerConfig>('container');
const dbConfig = config.getObject<DbConfig>('db');

export default Schema.parse({
  container: {
    port: containerConfig?.port,
    imageRepo: containerConfig?.imageRepo,
    imageTag: process.env.IMAGE_TAG,
  },
  db: {
    name: dbConfig?.name,
    user: dbConfig?.user,
  },
});
