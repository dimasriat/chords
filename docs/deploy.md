# Deployment

`chords` runs on the VPS as a systemd service behind Caddy.

- **Public URL:** https://chords.dimsky.xyz (TLS via Caddy/Let's Encrypt)
- **App:** Bun server (`index.ts`) bound to `127.0.0.1:3300`
- **DB:** `data/chords.db` (gitignored; `CHORDS_DB_PATH` overrides)

## systemd service

`/etc/systemd/system/chords.service` runs `bun index.ts` as user `dimas` with:

```
Environment=PORT=3300
Environment=BIND_HOST=127.0.0.1
Environment=CHORDS_DB_PATH=/home/dimas/projects/chords/data/chords.db
ExecStart=/home/dimas/.bun/bin/bun index.ts
Restart=always
```

Common commands:

```bash
sudo systemctl restart chords     # after pulling new code
systemctl status chords
journalctl -u chords -f            # logs
```

## Caddy

Block appended to `/etc/caddy/Caddyfile` (backup: `Caddyfile.bak-pre-chords`):

```
chords.dimsky.xyz {
	reverse_proxy localhost:3300
}
```

Reload after edits: `sudo systemctl reload caddy`.

## Deploying a new version

```bash
cd ~/projects/chords
git pull
bun install            # if deps changed
sudo systemctl restart chords
```
