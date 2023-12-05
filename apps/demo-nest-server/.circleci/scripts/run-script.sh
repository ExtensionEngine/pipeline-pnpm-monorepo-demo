#!/bin/bash

if [[ "$PKG_MANAGER" == "npm" ]]; then
  if [ -n "$PACKAGE" ]; then
    npm run "$SCRIPT" --workspace="$PACKAGE"
  else
    npm run "$SCRIPT"
  fi
elif [[ "$PKG_MANAGER" == "pnpm" ]]; then
  if [ -n "$PACKAGE" ]; then
    pnpm run --filter "$PACKAGE" "$SCRIPT"
  else
    pnpn run "$SCRIPT"
  fi
fi
