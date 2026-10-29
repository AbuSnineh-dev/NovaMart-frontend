# Repository layout

The local folder is a frontend repository with an independent backend checkout inside it:

```text
Novamart/              frontend Git repository
  app/
  components/
  lib/
  public/
  scripts/
  tests/
  backend/             separate NovaMart-backend Git repository (ignored by frontend)
```

## Frontend

Publish the main folder to a dedicated frontend repository. The root `.gitignore` excludes the entire backend checkout, dependencies, builds, local environment files, test outputs, and temporary MongoDB runtime metadata. `.env.example` remains available as a configuration template.

After cloning the frontend, run the setup commands in README. `npm run setup:backend` reconstructs the tested backend using the supplied upstream repository and integration patches, without copying backend code into frontend Git history. Existing backend files are preserved.

## Backend

The independent `backend/` checkout uses `https://github.com/AbuSnineh-dev/NovaMart-backend.git` as its origin. Commit and push its changes from that directory separately. The integration patch files in the frontend document the reproducible tested baseline; they are not substitutes for committing the actual backend fixes to the backend repository.

Keep real MongoDB credentials and JWT secrets in the backend `.env` file. Commit only `.env.example`.

## Repository destinations

- Frontend: `https://github.com/AbuSnineh-dev/NovaMart-frontend.git`
- Backend: `https://github.com/AbuSnineh-dev/NovaMart-backend.git`

The frontend is published independently of the nested backend checkout. Each repository has its own commits and remote tracking. Next.js regenerates `next-env.d.ts`; that machine-generated file is ignored, and `npm run typecheck` generates route types before invoking TypeScript.
