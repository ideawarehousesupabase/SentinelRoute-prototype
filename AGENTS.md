<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Architecture rules

- Firestore (`users` collection) is used ONLY for demo account CRUD (src/lib/accounts.ts); all operational data lives in src/state/demo-store.tsx + src/data mocks — per the client brief.
- Firebase web config is served by a server function reading project secrets, because the API key is stored as a secret, not a VITE_ var.
- Anomaly detection is deterministic rules in src/lib/rules.ts (tested in rules.test.ts); never present it as AI.
