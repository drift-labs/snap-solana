# Capture the start time
start_time=$(date +%s)

echo ""
echo "# INSTALLING SNAP DEV DEPENDENCIES"
echo ""
rm -rf node_modules && bun install
echo ""
echo "# BUILDING snap-core"
echo ""
cd snap-core && rm -rf node_modules && bun install && bun run build && bun link && cd ..
echo ""
echo "# BUILDING snap"
echo ""
cd snap && rm -rf node_modules && bun install && bun link @drift-labs/snap-solana-core && bun run build-webpack-plugin && bun run build && bun link && cd ..
echo ""
echo "# BUILDING snap-wallet-adapter"
echo ""
cd snap-wallet-adapter && rm -rf node_modules && bun install && bun run build && bun link && cd ..
echo ""

# Capture the end time
end_time=$(date +%s)

# Calculate and print the duration
duration=$((end_time - start_time))
echo "FINISHED .. Total time taken: $duration seconds"
echo ""
echo "*** You need to link the wallet adapter to your UI! ***"
echo ""
echo "You may now run the local dev script inside the snap directory to start serving the snap"
echo ""
