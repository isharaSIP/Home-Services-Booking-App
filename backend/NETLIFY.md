# Netlify deployment

Import the repository from GitHub. The root netlify.toml sets base directory backend, function directory netlify/functions, and the static publish directory netlify/public. Do not set npm start as a build command. Keep backend/.env out of Git.

Set MONGO_URI, JWT_SECRET and NODE_ENV=production in Netlify environment variables with Functions scope. Redeploy after changing variables. Configure Atlas network access for the function environment; Free functions do not have dedicated static egress. Do not copy database secrets into frontend settings.

After deployment, GET / must return the FixMate JSON message; GET /api/auth/me without a token must return 401. Test login, booking and photo upload with test accounts before building the APK. Set EXPO_PUBLIC_API_URL to https://YOUR-SITE.netlify.app/api only after these checks pass.

Local npm start and npm run dev still start the server. The function shares initialization within a warm instance, waits for MongoDB and booking/complaint indexes, and retries failed initialization on the next request. Separate instances each have their own MongoDB pool.

## Upload limitations

Netlify buffered requests and responses are limited to 6 MB, including encoding overhead. The adapter rejects received request bodies over 4 MiB with a helpful 413; the platform can reject larger requests before our code runs. Existing profile photos are capped at 1 MiB decoded (about 1.34 MiB base64) and fit individually. Signup NIC images plus certificates are not collectively capped by the existing UI and can exceed the limit. Reduce image sizes/document count for this deployment. Large existing document-list responses can also exceed the platform limit. Supporting larger uploads/responses requires separate object storage or pagination; this adapter does not silently discard or migrate documents. Local startup retains its 25 MB limit.

Run adapter tests: node --test tests/netlify.test.js. These use isolated dependency stubs and do not prove live Atlas or hosted Netlify connectivity.
