# Setting up the GitHub-hosted chat (about 5 minutes)

The chat is GitHub Discussions embedded with giscus. Threads, reactions and moderation are built in, no server needed.
It is threaded (not instant messaging) and users sign in with a free GitHub account.

1. Create a **public** repository, e.g. `halley-astro-chat`, and push this folder to it.
2. Repo **Settings > General > Features**: tick **Discussions**.
3. In **Discussions**, create a category named `General`.
4. Install the giscus app: https://github.com/apps/giscus and grant it access to the repo.
5. Open https://giscus.app, enter your repo, choose category `General`, then copy `data-repo-id` and `data-category-id`.
6. Edit `app/chat.js` and fill `CHAT_CONFIG`: `repo`, `repoId`, `categoryId`. Rebuild with `python bundle.py`, then copy `dist/HalleyAstro.html` to `index.html` in this repo.
7. **Settings > Pages**: set source to **GitHub Actions**. The included workflow publishes `index.html` on every push.

Each channel (General, Readings, Transits, Beginners, Chart Twins) is its own discussion thread, named `halley-astro-<channel>`.

The downloadable desktop app shows an "Open the chat on GitHub" button instead, because giscus cannot embed from a local file.
