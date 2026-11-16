cd D:\fund
npx vite build --mode development 2>&1 > ..\build_output.txt
echo "Exit code: %errorlevel%"
type ..\build_output.txt