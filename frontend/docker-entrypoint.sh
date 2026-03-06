#!/bin/sh
set -eu

# Replace build-time placeholders with runtime values on every container start.
: "${REACT_APP_API_URL:?REACT_APP_API_URL is required}"
: "${REACT_APP_REQUIRE_MOBILE:?REACT_APP_REQUIRE_MOBILE is required}"

SOURCE_DIR="/usr/share/nginx/html-template"
TARGET_DIR="/usr/share/nginx/html"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Missing $SOURCE_DIR with placeholder build output." >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
find "$TARGET_DIR" -mindepth 1 -delete
cp -a "$SOURCE_DIR"/. "$TARGET_DIR"/

API_URL="$REACT_APP_API_URL"
REQUIRE_MOBILE="$REACT_APP_REQUIRE_MOBILE"

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

replace_placeholder() {
  placeholder="$1"
  value="$2"
  escaped_value="$(escape_sed_replacement "$value")"

  find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' \) \
    -exec sed -i "s|$placeholder|$escaped_value|g" {} +
}

replace_placeholder "__REACT_APP_API_URL__" "$API_URL"
replace_placeholder "__REACT_APP_REQUIRE_MOBILE__" "$REQUIRE_MOBILE"
