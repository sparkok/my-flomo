#!/bin/bash

# Create the zip archive, excluding node_modules and .next
zip -r ../code.zip $(ls -A | grep -vE '^(node_modules|\.next)$')
mv ../code.zip .
echo "finish pack!"