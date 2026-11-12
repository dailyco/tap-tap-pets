#!/bin/sh
# Play in a window. With no name: your usual save. With a name: a separate game in saves/NAME.db, from scratch the
# first time and carried on after; your usual save is never touched.
#   sh play.sh            your usual save
#   sh play.sh fresh      a separate game called "fresh"
# RAEA=/path/to/raea sh play.sh ...   when raea isn't on your PATH
set -e
cd "$(dirname "$0")"
RAEA="${RAEA:-raea}"
if [ -n "$1" ]; then
  mkdir -p saves
  TAP_TAP_PETS_SAVE="$PWD/saves/$1.db"
  export TAP_TAP_PETS_SAVE
  echo "save: $TAP_TAP_PETS_SAVE"
fi
exec "$RAEA" play edit.tsx --size 1600x900
