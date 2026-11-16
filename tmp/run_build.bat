cd D:\fund
npx vite build > NUL 2>tmp_vite_error.txt
echo Error level: %errorlevel%
type tmp_vite_error.txt