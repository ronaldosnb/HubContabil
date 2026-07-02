/**
 * RPA – Emissão de DAS para MEI
 *
 * Uso:
 *   npm run emit-das -w @hubcontabil/rpa -- <CNPJ>
 *
 * Com resolução automática de hCaptcha (opcional):
 *   CAPSOLVER_API_KEY=sua_chave npm run emit-das -w @hubcontabil/rpa -- <CNPJ>
 *
 * Sem a chave, o script pausa e aguarda resolução manual no navegador.
 */

import { chromium } from "patchright";
import type { Page } from "patchright";

const CNPJ = process.argv[2];
const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY ?? "";

const URL_MEI =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao";

// ── Utilitários ──────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[RPA ${new Date().toLocaleTimeString("pt-BR")}] ${msg}`);
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function humanDelay() {
  return delay(700 + Math.random() * 600);
}

// ── Solver de hCaptcha via CapSolver ────────────────────────────────────────

interface CapSolverCreateResponse {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  taskId?: string;
}

interface CapSolverResultResponse {
  errorId: number;
  status: "idle" | "processing" | "ready" | "failed";
  solution?: { gRecaptchaResponse: string };
  errorCode?: string;
}

async function capsolverRequest<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`https://api.capsolver.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

async function resolveHCaptchaWithCapSolver(
  siteKey: string,
  websiteURL: string
): Promise<string> {
  const created = await capsolverRequest<CapSolverCreateResponse>("/createTask", {
    clientKey: CAPSOLVER_API_KEY,
    task: {
      type: "HCaptchaTaskProxyless",
      websiteURL,
      websiteKey: siteKey,
    },
  });

  if (created.errorId !== 0 || !created.taskId) {
    throw new Error(`CapSolver createTask falhou: ${created.errorDescription ?? created.errorCode}`);
  }

  log(`CapSolver task criada: ${created.taskId} – aguardando solução...`);

  for (let i = 0; i < 40; i++) {
    await delay(3_000);

    const result = await capsolverRequest<CapSolverResultResponse>("/getTaskResult", {
      clientKey: CAPSOLVER_API_KEY,
      taskId: created.taskId,
    });

    if (result.status === "ready" && result.solution) {
      log("✅ hCaptcha resolvido pelo CapSolver.");
      return result.solution.gRecaptchaResponse;
    }

    if (result.status === "failed") {
      throw new Error(`CapSolver falhou: ${result.errorCode ?? "unknown"}`);
    }

    log(`Aguardando CapSolver... (${i + 1}/40)`);
  }

  throw new Error("Timeout: CapSolver não resolveu o hCaptcha em 2 minutos.");
}

// ── Detecção e bypass de hCaptcha ───────────────────────────────────────────

async function handleHCaptchaIfPresent(page: Page): Promise<void> {
  const siteKeyEl = page.locator("[data-sitekey]").first();
  const hasCaptcha =
    (await siteKeyEl.count()) > 0 ||
    (await page.locator("iframe[src*='hcaptcha']").count()) > 0 ||
    (await page.locator(".h-captcha").count()) > 0;

  if (!hasCaptcha) return;

  log("⚠️  hCaptcha detectado na página!");

  if (!CAPSOLVER_API_KEY) {
    log("hCaptcha detectado mas CAPSOLVER_API_KEY não definida — continuando sem resolver.");
    return;
  }

  // Coleta o siteKey
  const siteKey = await siteKeyEl.getAttribute("data-sitekey");
  if (!siteKey) {
    log("Não foi possível obter o siteKey do hCaptcha. Tentando continuar...");
    return;
  }

  log(`Sitekey encontrado: ${siteKey.slice(0, 8)}...`);
  const token = await resolveHCaptchaWithCapSolver(siteKey, page.url());

  // Injeta o token nos campos ocultos do hCaptcha
  await page.evaluate((t) => {
    for (const name of ["h-captcha-response", "g-recaptcha-response"]) {
      document.querySelectorAll<HTMLTextAreaElement>(`[name="${name}"]`).forEach((el) => {
        el.value = t;
      });
    }
    // Dispara o callback do hCaptcha se disponível na página
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (typeof w.hcaptchaOnLoad === "function") w.hcaptchaOnLoad();
    if (w.hcaptcha) {
      try {
        const widgetId = Object.keys(w.hcaptcha._widgets ?? {})[0];
        if (widgetId != null) w.hcaptcha.execute(widgetId);
      } catch {
        /* ignora */
      }
    }
  }, token);

  await delay(1_200);

  // Submete o formulário se ainda estiver na página de captcha
  await page
    .evaluate(() => {
      const form = document.querySelector<HTMLFormElement>("form");
      form?.submit();
    })
    .catch(() => {
      /* ignora se não houver form */
    });

  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
  await delay(1_000);

  log("Página após resolução de captcha carregada.");
}

// ── Script principal ─────────────────────────────────────────────────────────

async function main() {
  if (!CNPJ) {
    console.error("[RPA] Uso: npm run emit-das -- <CNPJ>");
    console.error("[RPA] Exemplo: npm run emit-das -- 12345678000190");
    process.exit(1);
  }

  const now = new Date();

  // Competência = mês anterior (DAS de junho emitida em julho, etc.)
  // Se for janeiro, volta para dezembro do ano anterior
  const paDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const paYear = String(paDate.getFullYear());
  const paMonth = String(paDate.getMonth() + 1).padStart(2, "0"); // "01"–"12"
  const paValue = `${paYear}${paMonth}`; // ex: "202606"

  log(`Iniciando emissão de DAS — CNPJ: ${CNPJ} | Competência: ${paMonth}/${paYear}`);
  log(CAPSOLVER_API_KEY ? "Modo: resolução automática de captcha (CapSolver)" : "Modo: resolução manual de captcha");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome", // Chrome real — muito mais difícil de detectar que Chromium
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-infobars",
      "--disable-dev-shm-usage",
      "--start-maximized",
      "--disable-extensions-except=",
      "--disable-plugins-discovery",
    ],
  });

  const context = await browser.newContext({
    // User-Agent do Chrome 124 real no Linux
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.207 Safari/537.36",
    viewport: null, // null = respeita o tamanho real da janela
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    extraHTTPHeaders: {
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  // Patches adicionais de fingerprinting que o patchright não cobre
  await context.addInitScript(() => {
    // Garante que navigator.webdriver não apareça
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
      configurable: true,
    });

    // Plugins realistas
    Object.defineProperty(navigator, "plugins", {
      get: () =>
        Object.assign([
          { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
          { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
          { name: "Native Client", filename: "internal-nacl-plugin" },
        ]),
    });

    // Idiomas do Brasil
    Object.defineProperty(navigator, "languages", {
      get: () => ["pt-BR", "pt", "en-US", "en"],
    });

    // window.chrome presente (obrigatório para não ser detectado)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.chrome) {
      w.chrome = {
        app: { isInstalled: false },
        webstore: { onInstallStageChanged: {}, onDownloadProgress: {} },
        runtime: { PlatformOs: {}, PlatformArch: {}, PlatformNaclArch: {}, RequestUpdateCheckStatus: {}, OnInstalledReason: {}, OnRestartRequiredReason: {} },
      };
    }

    // Remove propriedades que denunciam CDP
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  });

  const page = await context.newPage();

  // ── Passo 1: Acessar o portal ──────────────────────────────────────────────
  log(`Passo 1 — Acessando: ${URL_MEI}`);
  await page.goto(URL_MEI, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await humanDelay();

  await handleHCaptchaIfPresent(page);

  // ── Passo 2: Preencher o CNPJ ──────────────────────────────────────────────
  log(`Passo 2 — Preenchendo CNPJ: ${CNPJ}`);

  // Aguarda qualquer input visível aparecer e clica nele para garantir o foco
  const cnpjInput = page.locator("input:visible").first();
  await cnpjInput.waitFor({ state: "visible", timeout: 15_000 });
  await cnpjInput.click();
  await delay(400);

  // Limpa o campo e digita caractere a caractere para simular humano
  await page.keyboard.press("Control+a");
  await delay(100);

  for (const char of CNPJ) {
    await page.keyboard.type(char, { delay: 70 + Math.random() * 90 });
  }

  await humanDelay();

  // ── Passo 3: Pressionar Enter (mais natural que clicar no botão) ──────────
  log("Passo 3 — Pressionando Enter para continuar...");
  await page.keyboard.press("Enter");
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });
  await humanDelay();

  await handleHCaptchaIfPresent(page);

  // ── Passo 4: Clicar em Emitir Guia de Pagamento (DAS) ────────────────────
  log("Passo 4 — Clicando em Emitir Guia de Pagamento (DAS)...");
  await page.getByRole("link", { name: "Emitir Guia de Pagamento (DAS)" }).click();
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });

  // ── Passo 5: Selecionar o ano no dropdown bootstrap-select ───────────────
  log(`Passo 5 — Selecionando ano ${paYear} no dropdown...`);

  // Abre o dropdown clicando no botão visual (data-id aponta para o select original)
  await page.locator('[data-id="anoCalendarioSelect"]').click();
  await delay(500);

  // Clica na opção do ano da competência — ignora as desabilitadas com :not(.disabled)
  await page
    .locator(`.dropdown-menu li:not(.disabled) a:has-text("${paYear}")`)
    .first()
    .click();

  await humanDelay();

  // Tab + Enter para avançar (mais natural que clicar em botão de submissão)
  await page.keyboard.press("Tab");
  await delay(200);
  await page.keyboard.press("Enter");
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });

  log("✅ Ano selecionado e página avançada!");

  // ── Passo 6: Marcar o checkbox do mês atual ───────────────────────────────
  log(`Passo 6 — Selecionando checkbox do mês ${paMonth}/${paYear} (PA: ${paValue})...`);

  // Aguarda a tabela carregar com os checkboxes de PA
  const checkbox = page.locator(`input.paSelecionado[value="${paValue}"]`);
  await checkbox.waitFor({ state: "visible", timeout: 15_000 });
  await checkbox.click();

  log(`✅ Mês ${paMonth}/${paYear} selecionado!`);
  await humanDelay();

  // ── Passo 7: Clicar em Apurar/Gerar DAS ──────────────────────────────────
  log("Passo 7 — Clicando em Apurar/Gerar DAS...");

  const btnGerar = page.locator("#btnEmitirDas");
  await btnGerar.waitFor({ state: "visible", timeout: 10_000 });
  await btnGerar.click();
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 });

  log("✅ DAS gerada!");
  log("👀 Navegador mantido aberto. Pressione Ctrl+C para encerrar.");

  // Mantém o navegador aberto indefinidamente
  await new Promise<void>(() => {});
}

main().catch((err: unknown) => {
  console.error("[RPA] Erro fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
