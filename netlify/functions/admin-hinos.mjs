const API_VERSION = "2022-11-28";
const catalogPath = "./JSON/hinos.json";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

function ghConfig() {
  return {
    token: requiredEnv("GITHUB_TOKEN"),
    owner: requiredEnv("GITHUB_OWNER"),
    repo: requiredEnv("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
    adminPassword: requiredEnv("ADMIN_PASSWORD")
  };
}

async function github(path, options = {}) {
  const cfg = ghConfig();
  const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`;

  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${cfg.token}`,
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "louvores-admin"
  };

  if (options.body) headers["Content-Type"] = "application/json";

  const r = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!r.ok) {
    let detail = "";
    try {
      const e = await r.json();
      detail = e.message || JSON.stringify(e);
    } catch (_) {
      detail = await r.text();
    }
    throw new Error(`GitHub ${r.status}: ${detail}`);
  }

  if (r.status === 204) return null;
  return r.json();
}

function decodeBase64(content) {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

function encodeBase64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

async function readFile(path) {
  const cfg = ghConfig();
  const data = await github(`${path}?ref=${encodeURIComponent(cfg.branch)}`);
  return {
    text: decodeBase64(data.content || ""),
    sha: data.sha
  };
}

async function putFile(path, text, message, sha = null) {
  const cfg = ghConfig();
  const body = {
    message,
    content: encodeBase64(text),
    branch: cfg.branch
  };
  if (sha) body.sha = sha;

  return github(path, { method: "PUT", body });
}

async function deleteFile(path, message, sha) {
  const cfg = ghConfig();
  return github(path, {
    method: "DELETE",
    body: {
      message,
      sha,
      branch: cfg.branch
    }
  });
}

function normalizeCatalog(raw) {
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    const maxId = parsed.reduce((m, h) => Math.max(m, Number(h.id) || 0), 0);
    return { ultimo_id: maxId, hinos: parsed };
  }

  const hinos = Array.isArray(parsed.hinos) ? parsed.hinos : [];
  const maxExisting = hinos.reduce((m, h) => Math.max(m, Number(h.id) || 0), 0);
  const ultimoId = Math.max(Number(parsed.ultimo_id) || 0, maxExisting);

  return { ultimo_id: ultimoId, hinos };
}

async function readCatalog() {
  //const file = await readFile("hinos.json");
  const file = await readFile(catalogPath);
  return {
    catalog: normalizeCatalog(file.text),
    sha: file.sha
  };
}

function catalogText(catalog) {
  return JSON.stringify(catalog, null, 2) + "\n";
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "hino";
}

function validateNumber(catalog, numero, ignoreId = null) {
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error("Número do hino inválido.");
  }

  const duplicate = catalog.hinos.find(h =>
    Number(h.numero) === numero &&
    String(h.id) !== String(ignoreId)
  );

  if (duplicate) {
    throw new Error(`Já existe um hino com o número ${numero}.`);
  }
}

async function getHymn(id) {
  const { catalog } = await readCatalog();
  const hymn = catalog.hinos.find(h => String(h.id) === String(id));
  if (!hymn) throw new Error("Hino não encontrado.");

  const letter = await readFile(hymn.arquivo);
  return { hymn, letra: letter.text };
}

async function createHymn(numero, titulo, letra, copyright) {
  const { catalog, sha: catalogSha } = await readCatalog();

  validateNumber(catalog, numero);

  const id = Number(catalog.ultimo_id || 0) + 1;
  const safeTitle = String(titulo || "").trim();
  if (!safeTitle) throw new Error("Título obrigatório.");
  if (!String(letra || "").trim()) throw new Error("Letra obrigatória.");

  let filename = `${slugify(safeTitle)}.txt`;
  let path = `letras/${filename}`;

  // Avoid filename collision even when titles are equal/similar.
  try {
    await readFile(path);
    filename = `${slugify(safeTitle)}-${id}.txt`;
    path = `letras/${filename}`;
  } catch (_) {
    // Expected when the file doesn't exist.
  }

  // 1) Create lyrics file.
  await putFile(
    path,
    String(letra).trim() + "\n",
    `[skip netlify] Adicionar letra do hino ${numero}`
  );

  // 2) Update catalog.
  catalog.ultimo_id = id;
  catalog.hinos.push({
    id,
    numero,
    titulo: safeTitle,
    arquivo: path,
    copyright
  });

  try {
    await putFile(
      //"hinos.json",
      //"./JSON/hinos.json",
      catalogPath,
      catalogText(catalog),
      `[skip netlify] Adicionar hino ${numero} - ${safeTitle}`,
      catalogSha
    );
  } catch (e) {
    // Best-effort rollback of the newly-created lyric file if catalog update fails.
    try {
      const created = await readFile(path);
      await deleteFile(path, `[skip netlify] Rollback da inclusão do hino ${numero}`, created.sha);
    } catch (_) {}
    throw e;
  }

  return { id, numero, titulo: safeTitle, arquivo: path, copyright };
}

async function updateHymn(id, numero, titulo, letra, copyright) {
  const { catalog, sha: catalogSha } = await readCatalog();
  const hymn = catalog.hinos.find(h => String(h.id) === String(id));
  if (!hymn) throw new Error("Hino não encontrado.");

  validateNumber(catalog, numero, id);

  const safeTitle = String(titulo || "").trim();
  if (!safeTitle) throw new Error("Título obrigatório.");
  if (!String(letra || "").trim()) throw new Error("Letra obrigatória.");

  const lyricFile = await readFile(hymn.arquivo);

  // Keep the same filename/path on edit; the file path is an internal identifier.
  await putFile(
    hymn.arquivo,
    String(letra).trim() + "\n",
    `[skip netlify] Atualizar letra do hino ${numero}`,
    lyricFile.sha
  );

  hymn.numero = numero;
  hymn.titulo = safeTitle;
  hymn.copyright = copyright;

  await putFile(
    //"hinos.json",
    //"./JSON/hinos.json",
    catalogPath,
    catalogText(catalog),
    `[skip netlify] Atualizar hino ${numero} - ${safeTitle}`,
    catalogSha
  );

  return hymn;
}

async function deleteHymn(id) {
  const { catalog, sha: catalogSha } = await readCatalog();
  const index = catalog.hinos.findIndex(h => String(h.id) === String(id));
  if (index < 0) throw new Error("Hino não encontrado.");

  const hymn = catalog.hinos[index];

  // First remove from catalog so public index stops referencing it.
  catalog.hinos.splice(index, 1);
  await putFile(
    //"hinos.json",
    //"./JSON/hinos.json",
    catalogPath,
    catalogText(catalog),
    `[skip netlify] Excluir hino ${hymn.numero} - ${hymn.titulo}`,
    catalogSha
  );

  // Then remove the lyric file.
  try {
    const lyric = await readFile(hymn.arquivo);
    await deleteFile(
      hymn.arquivo,
      `[skip netlify] Excluir letra do hino ${hymn.numero}`,
      lyric.sha
    );
  } catch (e) {
    // Catalog deletion succeeded; return a warning instead of recreating the record.
    return { hymn, warning: `Entrada removida do catálogo, mas não foi possível remover o arquivo da letra: ${e.message}` };
  }

  return { hymn };
}


async function publishChanges() {
  const path = ".publish-trigger";

  let sha = null;
  try {
    const current = await readFile(path);
    sha = current.sha;
  } catch (_) {
    // First publication: file does not exist yet.
  }

  const stamp = new Date().toISOString() + "\n";

  await putFile(
    path,
    stamp,
    `Publicar alterações em ${stamp.trim()}`,
    sha
  );

  return { published_at: stamp.trim() };
}

export default async (req) => {
  try {
    const cfg = ghConfig();
    const suppliedPassword = req.headers.get("x-admin-password") || "";

    if (suppliedPassword !== cfg.adminPassword) {
      return jsonResponse(401, { error: "Senha inválida." });
    }

    if (req.method === "GET") {
      const { catalog } = await readCatalog();
      return jsonResponse(200, {
        ultimo_id: catalog.ultimo_id,
        hinos: catalog.hinos
      });
    }

    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Método não permitido." });
    }

    const body = await req.json();
    const action = body.action;

    if (action === "get") {
      const { hymn, letra } = await getHymn(body.id);
      return jsonResponse(200, { hino: hymn, letra });
    }

    if (action === "create") {
      const hymn = await createHymn(Number(body.numero), body.titulo, body.letra, body.copyright);
      return jsonResponse(200, {
        message: `Hino ${hymn.numero} criado e salvo no GitHub. Ainda não publicado.`,
        hino: hymn
      });
    }

    if (action === "update") {
      const hymn = await updateHymn(body.id, Number(body.numero), body.titulo, body.letra, body.copyright);
      return jsonResponse(200, {
        message: `Hino ${hymn.numero} atualizado e salvo no GitHub. Ainda não publicado.`,
        hino: hymn
      });
    }

    if (action === "delete") {
      const result = await deleteHymn(body.id);
      return jsonResponse(200, {
        message: result.warning || `Hino ${result.hymn.numero} excluído do GitHub. Ainda não publicado.`,
        warning: result.warning || null
      });
    }

    if (action === "publish") {
      const result = await publishChanges();
      return jsonResponse(200, {
        message: "Publicação solicitada. O Netlify deverá iniciar um único deploy de produção.",
        ...result
      });
    }

    return jsonResponse(400, { error: "Ação inválida." });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: e.message || "Erro interno." });
  }
};
