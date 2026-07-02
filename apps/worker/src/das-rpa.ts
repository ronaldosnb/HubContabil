import { chromium, type Page } from "patchright";
import { mkdirSync, writeFileSync, readdirSync, renameSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export type DasRpaOptions = {
  cnpj: string;
  downloadDir: string;
  paValue: string;
  capsolverApiKey?: string;
};

const URL_MEI =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function humanDelay() {
  return delay(700 + Math.random() * 600);
}

async function resolveHCaptcha(siteKey: string, websiteURL: string, apiKey: string): Promise<string> {
  const created = await fetch("https://api.capsolver.com/createTask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientKey: apiKey,
      task: { type: "HCaptchaTaskProxyless", websiteURL, websiteKey: siteKey },
    }),
  }).then((r) => r.json() as Promise<{ errorId: number; taskId?: string; errorDescription?: string }>);

  if (created.errorId !== 0 || !created.taskId) {
    throw new Error(`CapSolver createTask falhou: ${created.errorDescription}`);
  }

  for (let i = 0; i < 40; i++) {
    await delay(3_000);
    const result = await fetch("https://api.capsolver.com/getTaskResult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientKey: apiKey, taskId: created.taskId }),
    }).then((r) => r.json() as Promise<{ status: string; solution?: { gRecaptchaResponse: string } }>);

    if (result.status === "ready" && result.solution) return result.solution.gRecaptchaResponse;
  }

  throw new Error("CapSolver timeout ao resolver hCaptcha.");
}

async function handleHCaptcha(page: Page, capsolverApiKey?: string) {
  const siteKeyEl = page.locator("[data-sitekey]").first();
  const hasCaptcha =
    (await siteKeyEl.count()) > 0 ||
    (await page.locator("iframe[src*='hcaptcha']").count()) > 0;

  if (!hasCaptcha) return;

  if (!capsolverApiKey) return;

  const siteKey = await siteKeyEl.getAttribute("data-sitekey");
  if (!siteKey) return;

  const token = await resolveHCaptcha(siteKey, page.url(), capsolverApiKey);

  await page.evaluate((t: string) => {
    document.querySelectorAll<HTMLTextAreaElement>("[name='h-captcha-response'],[name='g-recaptcha-response']").forEach((el) => {
      el.value = t;
    });
  }, token);

  await delay(1_000);
  await page.evaluate(() => { (document.querySelector("form") as HTMLFormElement | null)?.submit(); }).catch(() => {});
  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
}

/**
 * Executa o RPA de emissão de DAS para um CNPJ e retorna o caminho do PDF baixado.
 * Roda em modo headless (produção). Usa o mesmo fluxo validado no script de desenvolvimento.
 */
export async function emitDasRpa(options: DasRpaOptions): Promise<string> {
  const { cnpj, downloadDir, paValue, capsolverApiKey } = options;

  mkdirSync(downloadDir, { recursive: true });

  const paYear = paValue.slice(0, 4);
  const paMonth = paValue.slice(4, 6);

  const userDataDir = join(homedir(), ".hubcontabil-worker-rpa");
  const defaultDir = join(userDataDir, "Default");
  mkdirSync(defaultDir, { recursive: true });

  writeFileSync(
    join(defaultDir, "Preferences"),
    JSON.stringify({
      download: { default_directory: downloadDir, prompt_for_download: false, directory_upgrade: true },
      safebrowsing: { enabled: false, enhanced: false },
      profile: { default_content_setting_values: { automatic_downloads: 1 } },
    })
  );

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: "chrome",
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-features=InsecureDownloadWarnings,DownloadBubble,DownloadBubbleV2",
      "--safebrowsing-disable-auto-update",
      "--disable-client-side-phishing-detection",
    ],
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.207 Safari/537.36",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    acceptDownloads: true,
    extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9" },
  });

  await context.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US'] });
    if (!window.chrome) window.chrome = { runtime: {}, app: { isInstalled: false } };
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  `);

  const page = await context.newPage();

  try {
    // Passo 1: acessar portal
    await page.goto(URL_MEI, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await humanDelay();
    await handleHCaptcha(page, capsolverApiKey);

    // Passo 2: preencher CNPJ
    const cnpjInput = page.locator("input:visible").first();
    await cnpjInput.waitFor({ state: "visible", timeout: 15_000 });
    await cnpjInput.click();
    await delay(300);
    await page.keyboard.press("Control+a");
    for (const char of cnpj) {
      await page.keyboard.type(char, { delay: 60 + Math.random() * 80 });
    }
    await humanDelay();

    // Passo 3: Enter para avançar
    await page.keyboard.press("Enter");
    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });
    await humanDelay();
    await handleHCaptcha(page, capsolverApiKey);

    // Passo 4: Emitir Guia de Pagamento (DAS)
    await page.getByRole("link", { name: "Emitir Guia de Pagamento (DAS)" }).click();
    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });
    await humanDelay();

    // Passo 5: selecionar ano
    await page.locator('[data-id="anoCalendarioSelect"]').click();
    await delay(500);
    await page.locator(`.dropdown-menu li:not(.disabled) a:has-text("${paYear}")`).first().click();
    await humanDelay();
    await page.keyboard.press("Tab");
    await delay(200);
    await page.keyboard.press("Enter");
    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });

    // Passo 6: selecionar checkbox do mês
    const checkbox = page.locator(`input.paSelecionado[value="${paValue}"]`);
    await checkbox.waitFor({ state: "visible", timeout: 15_000 });
    await checkbox.click();
    await humanDelay();

    // Passo 7: gerar DAS
    const btnGerar = page.locator("#btnEmitirDas");
    await btnGerar.waitFor({ state: "visible", timeout: 10_000 });
    await btnGerar.click();
    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });
    await humanDelay();

    // Passo 8: download do PDF
    const btnImprimir = page.locator('a[href*="imprimir"]');
    await btnImprimir.waitFor({ state: "visible", timeout: 10_000 });

    const beforeFiles = new Set(readdirSync(downloadDir));
    const expectedFile = join(downloadDir, `das_${cnpj}_${paValue}.pdf`);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      btnImprimir.click(),
    ]);

    const tempPath = await download.path();

    if (tempPath) {
      const { copyFileSync } = await import("fs");
      copyFileSync(tempPath, expectedFile);
    } else {
      let foundName: string | null = null;
      for (let i = 0; i < 30; i++) {
        await delay(1_000);
        const current = readdirSync(downloadDir);
        const newFiles = current.filter((f) => !beforeFiles.has(f) && !f.endsWith(".crdownload"));
        if (newFiles.length > 0) { foundName = newFiles[0]; break; }
      }
      if (!foundName) {
        const reason = await download.failure();
        throw new Error(`Download não encontrado. Motivo: ${reason ?? "desconhecido"}`);
      }
      renameSync(join(downloadDir, foundName), expectedFile);
    }

    return expectedFile;
  } finally {
    await context.close();
  }
}

/** Calcula o paValue (YYYYMM) do mês anterior à data atual. */
export function buildPaValue(from = new Date()): string {
  const paDate = new Date(from.getFullYear(), from.getMonth() - 1, 1);
  const y = String(paDate.getFullYear());
  const m = String(paDate.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}
