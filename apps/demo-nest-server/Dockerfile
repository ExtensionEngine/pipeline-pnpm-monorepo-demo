FROM node:24.3.0-bookworm-slim@sha256:8225b1806c6e37dced949224b5c0d8278a2fe593967288620e0af69b2cbc4539 AS base

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

###

FROM node:24.3.0-bookworm@sha256:256a2e7037e745228f7630d578e6c1d327ab4c0a8e401c63d0d4d9dfb3c13465 AS install

WORKDIR /workspace

ENV APP_NAME="demo-nest-server"
ENV APP_PATH="apps/${APP_NAME}"
ENV PNPM_HOME="/pnpm"
ENV PNPM_VERSION="10.13.1"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ${APP_PATH}/package.json ./${APP_PATH}/

###

FROM install AS build

COPY ${APP_PATH}/tsconfig.json ${APP_PATH}/tsconfig.build.json ${APP_PATH}/nest-cli.json ./${APP_PATH}/
COPY ${APP_PATH}/src ./${APP_PATH}/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter=${APP_NAME} --frozen-lockfile
RUN pnpm --filter=${APP_NAME} run build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=${APP_NAME} --prod deploy ./output 

###

FROM build AS local

WORKDIR /workspace/output

COPY ${APP_PATH}/.env ./

CMD ["node", "dist/main.js"]

###

FROM base AS configure

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /workspace/output/node_modules ./node_modules
COPY --chown=node:node --from=build /workspace/output/dist ./dist

###

FROM configure AS service

ENV NODE_ENV="production"

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
