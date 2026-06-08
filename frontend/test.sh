#!/bin/bash



echo "Running PoishaGo Frontend Tests..."
echo "-----------------------------------"

# Run the vitest test suite
npm run test:run

# Capture the exit code
TEST_EXIT_CODE=$?

echo "-----------------------------------"
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "All tests passed successfully!"
else
  echo "Some tests failed. Please check the output above."
fi

exit $TEST_EXIT_CODE
