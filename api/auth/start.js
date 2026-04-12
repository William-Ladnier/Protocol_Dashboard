export default async function handler(req, res) {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const redirectUri = process.env.GITHUB_APP_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).send("Missing GitHub auth configuration.");
    return;
  }

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "contents:write");
  res.writeHead(302, { Location: url.toString() });
  res.end();
}

