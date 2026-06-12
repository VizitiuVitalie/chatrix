import { spawn } from 'node:child_process';

const ngrokUrl = process.env.NGROK_URL;
const ngrokAuthtoken = process.env.NGROK_AUTHTOKEN;

if (!ngrokUrl || ngrokUrl.length === 0) {
  console.error(
    '[tunnel:prod] NGROK_URL is empty — set it in backend/infra/.env.prod.infra',
  );
  process.exit(1);
}
if (!ngrokAuthtoken || ngrokAuthtoken.length === 0) {
  console.error(
    '[tunnel:prod] NGROK_AUTHTOKEN is empty — set it in backend/infra/.env.prod.infra',
  );
  process.exit(1);
}

const child = spawn(
  'ngrok',
  [
    'http',
    `--url=${ngrokUrl}`,
    `--authtoken=${ngrokAuthtoken}`,
    '80',
  ],
  { stdio: 'inherit', shell: true },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
