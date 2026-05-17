# DigitalOcean Droplet deployment reference

End-to-end notes for deploying this stack (Node / Express, Gulp-built assets, MongoDB Atlas) on a **DigitalOcean Droplet** with **Nginx**, **systemd**, **TLS**, and **DNS**—including **store subdomains** and **OOM / swap** fixes.

---

## Why a Droplet

- **MongoDB Atlas** is hosted separately; you do not need MongoDB on the VM.
- A small Droplet is often **cheaper** than App Platform for a single always-on Node app.
- **Tradeoff:** you manage OS updates, Nginx, the Node process, and deploy scripts.

---

## Droplet setup

- **Image:** Ubuntu LTS.
- **Access:** SSH with a key, e.g. `ssh root@143.110.222.203` (or a non-root sudo user).
- **Firewall:**

  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 80
  sudo ufw allow 443
  # or: sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```

**Startup scripts (DigitalOcean “user data”):** fine for installing `nginx`, `git`, `ufw`, Node—**never** put API keys, `DB_URL`, or private Git clone tokens in user data.

---

## Node.js

Install an LTS Node (e.g. via [NodeSource](https://github.com/nodesource/distributions) or your preferred method). Confirm:

```bash
node -v
npm -v
```

---

## Application install and run

All commands assume the **app root**: the directory that contains `package.json` and `backend/` (e.g. `/var/www/Zairflow-UAT`).

### Install dependencies

```bash
cd /var/www/Zairflow-UAT
npm ci
# If you have no lockfile or ci fails: npm install
```

### Build frontend for production

```bash
npm run build
```

### Run in production

On a Droplet, run the app **once** under **systemd** (see [systemd service](#systemd-service)). Do **not** start a second copy with `npm run start:render` in an SSH session while the service is already running—that causes **`EADDRINUSE`** on port **3001** (see [Port already in use](#port-already-in-use-eaddrinuse)).

The process command is **`node backend/server.js`** (same as `npm run start:render`). Use **`start:render`**, not **`npm start`**:

- **`npm run start:render`** — production API + static assets (`node backend/server.js`). Use in **`ExecStart`** or for one-off debugging after stopping systemd.
- **`npm start`** — Gulp watch + server; **development only**.

Confirm the app is up without starting another instance:

```bash
curl -sI http://127.0.0.1:3001/health
```

(Use the port from `PORT` in `.env` if it is not **3001**.)

### Local development (for comparison)

- Full dev: `npm run dev`
- API only with reload: `nodemon backend/server.js` from **repo root** (or `nodemon server.js` from `backend/`).

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DB_URL` | MongoDB connection string (Atlas). Used by `backend/config/database.js`. |
| `PORT` | HTTP port for Express; defaults to **3001** in `backend/server.js` if unset. |
| `NODE_ENV` | Set to `production` in production. |

Store secrets in `/var/www/.../.env` with restrictive permissions:

```bash
chmod 600 /var/www/Zairflow-UAT/.env
```

Or inject them via **systemd** `Environment=` / `EnvironmentFile=`.

**`Error: Cannot find module 'dotenv'`:** dependencies are missing. Run `npm ci` in the **app root** (same folder as `package.json`).

---

## systemd service

Example unit pattern:

- **`WorkingDirectory`:** app root (e.g. `/var/www/Zairflow-UAT`).
- **`ExecStart`:** `/usr/bin/node backend/server.js` (equivalent to `npm run start:render`).
- **`EnvironmentFile`:** path to `.env` if you use one (e.g. `/var/www/Zairflow-UAT/.env`).

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now <service-name>
sudo systemctl status <service-name>
sudo journalctl -u <service-name> -f
```

After code or env changes, **restart** the service—do not run `npm run start:render` in the foreground on the same port:

```bash
sudo systemctl restart <service-name>
```

Find a running unit if the name is unclear:

```bash
systemctl list-units --type=service --state=running | grep -iE 'zairflow|node'
```

Health check: `curl -sI http://127.0.0.1:3001/health` (adjust port to match `PORT`).

---

## Nginx reverse proxy

Nginx terminates **HTTP (80)** and **HTTPS (443)** and forwards to Node.

### Minimal `location /` block

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Match **`proxy_pass`** to the **`PORT`** your app uses (default **3001**).

### `server_name`

List every hostname users will type, for example:

- `zairflow.com`
- `www.zairflow.com`
- Per-store hosts: `perfume-store.zairflow.com`, or `*.zairflow.com` if your Nginx build and certificates support it.

Apply the same names on **both** port **80** and **443** server blocks after Certbot.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/<your-site> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### “Welcome to nginx!” on your domain

Traffic is hitting the **default site**, not your app vhost. Typical fixes:

1. Remove the default site: `sudo rm /etc/nginx/sites-enabled/default`
2. Ensure your vhost **`server_name`** includes the hostname (for **HTTPS** too).
3. That vhost must **`proxy_pass`** to Node, not serve static default HTML.

---

## DNS (e.g. Namecheap)

### Apex / www pointed at GitHub Pages

If `@` uses GitHub’s **185.199.108.x** (etc.) A records and `www` is a **CNAME** to `*.github.io`, **Let’s Encrypt on your Droplet will fail** for `zairflow.com` / `www` until those names resolve to **this Droplet**.

**Options:**

- **App on Droplet for apex/www:** replace those records with **A** (and optional **AAAA**) to the **Droplet IP**; remove GitHub-targeting records for names you want on the server.
- **Marketing on GitHub, app on Droplet:** keep apex/www on GitHub; use a subdomain (e.g. `app.zairflow.com`) with an **A** record to the Droplet and Certbot **only** that name.

### Store subdomains (`{slug}.zairflow.com`)

The app derives the store **slug** from the hostname when it is not a reserved “platform” host (see `backend/middleware/storeIsolation.js`—e.g. `onrender.com` is special; your own domain is not).

**DNS examples:**

| Goal | Type | Host (Namecheap-style) | Value |
|------|------|-------------------------|--------|
| One store | A | `perfume-store` | Droplet IPv4 |
| Any slug | A | `*` | Droplet IPv4 (wildcard) |

Ensure a **Store** exists in MongoDB with matching **`slug`** and **`isActive: true`**.

---

## TLS (Certbot)

One hostname per **`-d`** (no `https://`):

```bash
sudo certbot --nginx -d zairflow.com -d www.zairflow.com -d perfume-store.zairflow.com
```

**Requirements:** public DNS for those names points to this Droplet; Nginx serves port **80**; `server_name` matches.

**Wildcard** `*.zairflow.com` usually needs **DNS-01** validation, not only `--nginx`.

---

## `npm ci` exits with `Killed`

**Symptom:** `Killed` during `npm ci` / install, often with no Node stack trace.

**Cause:** **out of memory**—the Linux OOM killer stops the process. Small Droplets (e.g. 512 MB RAM) often cannot finish `npm ci` without swap.

### Add swap (example: 2 GB)

```bash
sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Then retry `npm ci` from the app root.

**If it still dies:** increase swap size, resize the Droplet to more RAM, or build on CI and deploy artifacts.

**Note:** `npm ci --omit=dev` saves memory only if you do not need devDependencies to **build**. This project uses Gulp for `npm run build`; many build tools live in devDependencies—**full install + swap** is the usual fix on small VMs.

**Optional check:** `sudo dmesg -T | tail -40` for OOM / “Killed process” lines.

---

## Port already in use (`EADDRINUSE`)

**Symptom:** Starting the app prints Redis/DB success, then fails with:

```text
Error: listen EADDRINUSE: address already in use :::3001
```

**Cause:** Port **3001** (or your `PORT`) is already bound—usually because **systemd** is already running the app, or a previous manual `npm run start:render` / `node backend/server.js` is still running.

`backend/server.js` connects to Redis and MongoDB **before** calling `listen()`, so you can see “connected” logs and still fail when binding the port.

### Check whether the app is already healthy

```bash
curl -sI http://127.0.0.1:3001/health
```

If that responds, the server is already up; use **`systemctl restart`** for deploys instead of starting another process.

### See what owns the port

```bash
sudo lsof -i :3001
# or
sudo ss -tlnp | grep 3001
```

| What you see | What to do |
|--------------|------------|
| `node` under a **systemd** unit | App is managed by systemd—`sudo systemctl restart <service-name>`; do not run `npm run start:render` again in SSH |
| `node` from an old SSH session | Orphan process—stop it, then use systemd (or one intentional foreground start) |
| Two `node` listeners | Duplicate start—stop one; keep a single process |

### Fix

**Normal production (systemd already running):**

```bash
sudo systemctl restart <service-name>
sudo journalctl -u <service-name> -f
```

**Orphan manual process (no systemd, or you started it by hand):**

```bash
sudo kill $(sudo lsof -t -i:3001)
sudo systemctl start <service-name>   # preferred
```

**Debugging in the foreground:** stop systemd (or kill the port holder) first, then:

```bash
npm run start:render
```

**Temporary alternate port** (only if Nginx `proxy_pass` matches):

```bash
PORT=3002 npm run start:render
```

---

## Routine deploy

```bash
cd /var/www/Zairflow-UAT
git pull
npm ci
npm run build
sudo systemctl restart <service-name>
curl -sI http://127.0.0.1:3001/health
```

Do **not** run `npm run start:render` after `systemctl restart` unless the service is stopped and you are intentionally running a single foreground instance.

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Render-oriented deployment.
- [SUBDOMAIN_SETUP.md](./SUBDOMAIN_SETUP.md) — Subdomain behavior and setup.
- [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) — Atlas connection and network access.
