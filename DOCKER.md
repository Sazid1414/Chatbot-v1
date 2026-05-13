# Run the full stack in Docker

This compose file starts **Postgres**, **GoTrue (Supabase-compatible auth)**, **PostgREST**, an **nginx** gateway (Supabase-style `/auth/v1` + `/rest/v1`), **Ollama**, the **FastAPI** backend, and the **Next.js** frontend.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2) on Windows, macOS, or Linux.
- Enough disk space for the Ollama model you choose (e.g. Llama 3 is several GB).

## 1. Create the environment file

From the repository root:

```powershell
Copy-Item .env.docker.example .env.docker
```

On macOS/Linux:

```bash
cp .env.docker.example .env.docker
```

The example file uses the standard Supabase self-host demo **JWT_SECRET** and matching **ANON_KEY** / **SERVICE_ROLE_KEY**. For anything beyond local development, generate new secrets and keys (see [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting/docker#configuring-and-securing-supabase)).

By default the example enables **auth bypass** for demos (`AUTH_DISABLED=true`, `NEXT_PUBLIC_AUTH_DISABLED=true`). All API calls use a fixed demo user id. Set both to `false` and rebuild the frontend when you want real Supabase login again. The API gateway no longer waits for GoTrue to be healthy, so the stack can start even if the `auth` container fails.

## 2. Build and start all services

```bash
docker compose --env-file .env.docker up -d --build
```

First start can take several minutes while images download and the frontend builds.

## 3. Pull the Ollama model

The UI defaults to **Llama 3**. The API calls Ollama with a **tag** (e.g. `llama3:latest`). Pull the model into the Ollama container **once** (large download):

```bash
docker compose --env-file .env.docker exec ollama ollama pull llama3
```

If chat shows an error mentioning **404** or **model not found**, the model is missing or the name does not match—run `ollama list` inside the container and align the **Model** dropdown / `OLLAMA_MODEL` with a listed name.

To use another name from `backend/app/services/model_router.py`, set `OLLAMA_MODEL` and pull it, for example:

```bash
docker compose --env-file .env.docker exec ollama ollama pull mistral
```

## 4. Open the app

- **App:** http://localhost:3000  
- **API:** http://localhost:8001 by default (see `BACKEND_PORT` and `NEXT_PUBLIC_API_URL` in `.env.docker`; e.g. http://localhost:8001/api/health)  
- **Supabase-compatible API (via gateway):** http://localhost:54321  
- **Ollama:** http://localhost:11434  
- **Mailpit (auth emails in dev):** http://localhost:8025 (change with `MAILPIT_UI_PORT` in `.env.docker`)

With **auth bypass** enabled (default in `.env.docker.example`), you land on `/chat` without signing in. With bypass off, sign up on the login page with email/password; `GOTRUE_MAILER_AUTOCONFIRM` is enabled, so you do not need to confirm email for local use. Outbound mail goes to Mailpit inside the stack.

## 5. Useful commands

| Action | Command |
|--------|---------|
| View logs | `docker compose --env-file .env.docker logs -f` |
| Stop | `docker compose --env-file .env.docker down` |
| Stop and remove DB + Ollama volumes | `docker compose --env-file .env.docker down -v` |
| Rebuild after code changes | `docker compose --env-file .env.docker up -d --build` |

## 6. Google OAuth in Docker

Email/password works out of the box. Google sign-in requires OAuth client IDs, secrets, and redirect URLs aligned with `API_EXTERNAL_URL` and the Supabase gateway. Configure GoTrue in `docker-compose.yml` following [Supabase self-hosted OAuth](https://supabase.com/docs/guides/self-hosting/self-hosted-oauth); this is optional for local email login.

## 7. GPU with Ollama (optional)

On Linux with NVIDIA, you can add a `deploy` section for the `ollama` service per [Ollama Docker GPU](https://github.com/ollama/ollama/blob/main/docs/docker.md). Docker Desktop on Windows with WSL2 GPU pass-through may work with the same pattern inside WSL.

## Troubleshooting

- **`docker compose` cannot find the env file:** always pass `--env-file .env.docker` from the repo root, or rename to `.env` (Compose loads `.env` automatically).
- **Chat errors or empty replies:** confirm the model finished downloading (`docker compose exec ollama ollama list`). Pull with `docker compose exec ollama ollama pull llama3` if `llama3` (or your chosen model) is missing.
- **401 / auth errors:** if auth bypass is off, ensure `JWT_SECRET`, `ANON_KEY`, and `SERVICE_ROLE_KEY` in `.env.docker` match the demo triple in `.env.docker.example` unless you regenerated keys. With bypass on, the backend still needs a valid `SERVICE_ROLE_KEY` for PostgREST.
- **Database reset:** `docker compose down -v` removes volumes; the next `up` recreates Postgres and reapplies `docker/postgres/init/01-schema.sql`. GoTrue will recreate the `auth` schema on first connection.
