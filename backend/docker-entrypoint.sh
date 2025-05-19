#!/bin/bash
set -e

# Install bcryptjs if needed
npm list bcryptjs || npm install bcryptjs@2.4.3 --save

# Run the bcrypt patch script if it exists
if [ -f "bcrypt-patch.js" ]; then
  echo "Patching bcrypt with bcryptjs..."
  node bcrypt-patch.js
fi

# Start the server
echo "Starting server..."
exec "$@" 