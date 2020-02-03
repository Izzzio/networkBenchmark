echo off

echo Preparing fixtures
del /F /S /Q runtime\* > nul 2>&1
echo "" > runtime\dumb
copy fixture\* runtime\ > nul 2>&1

echo Running tests
node ../main.js --no-splash --fall-on-errors
