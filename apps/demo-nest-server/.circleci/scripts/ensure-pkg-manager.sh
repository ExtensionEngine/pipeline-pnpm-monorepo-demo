if [ "$PKG_MANAGER" == "pnpm" ]; then
  corepack enable
  corepack prepare pnpm@latest --activate
  pnpm config set store-dir ~/.pnpm-store
fi
