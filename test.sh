echo "Preparing fixtures"
rm -R ./runtime/*
echo "" > runtime/dumb
cp -R fixture/* runtime/

echo "Running tests"
node ../main.js --no-splash --fall-on-errors
