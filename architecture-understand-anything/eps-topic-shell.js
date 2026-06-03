const view = {
  w: 1280,
  h: 720,
  scale: 1,
  tx: 0,
  ty: 0,
  dragging: false,
  dragX: 0,
  dragY: 0
};

function byId(id) {
  return document.getElementById(id);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function updateTransform() {
  const vp = byId("viewport");
  if (vp) {
    vp.setAttribute("transform", `matrix(${view.scale} 0 0 ${view.scale} ${view.tx} ${view.ty})`);
  }
  const z = byId("zoomText");
  const r = byId("zoomRange");
  const p = Math.round(view.scale * 100);
  if (z) z.textContent = `${p}%`;
  if (r) r.value = String(p);
}

function zoomAt(x, y, targetScale) {
  const oldScale = view.scale;
  const newScale = clamp(targetScale, 0.6, 3.2);
  if (Math.abs(newScale - oldScale) < 1e-6) return;
  view.scale = newScale;
  view.tx = view.tx + (oldScale - newScale) * x;
  view.ty = view.ty + (oldScale - newScale) * y;
  updateTransform();
}

function resetZoom() {
  view.scale = 1;
  view.tx = 0;
  view.ty = 0;
  updateTransform();
}

function clientToSvgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (view.w / rect.width),
    y: (clientY - rect.top) * (view.h / rect.height)
  };
}

function bindViewport() {
  const svg = byId("diagramSvg");
  if (!svg) return;
  const meta = window.TOPIC_META || {};
  let userChangedMode = false;

  function applyModeFilter() {
    // Keep all nodes visible to avoid browser-restored select states causing apparent graph loss.
    document.querySelectorAll("[data-mode]").forEach((n) => {
      n.style.opacity = "1";
    });
  }

  function forceFullMode() {
    if (userChangedMode) return;
    const modeNode = byId("modeFilter");
    if (!modeNode) return;
    modeNode.value = "all";
    applyModeFilter();
  }

  byId("zoomIn").addEventListener("click", () => zoomAt(view.w / 2, view.h / 2, view.scale * 1.15));
  byId("zoomOut").addEventListener("click", () => zoomAt(view.w / 2, view.h / 2, view.scale / 1.15));
  byId("zoomReset").addEventListener("click", resetZoom);

  byId("zoomRange").addEventListener("input", () => {
    zoomAt(view.w / 2, view.h / 2, Number(byId("zoomRange").value) / 100);
  });

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = clientToSvgPoint(svg, e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(p.x, p.y, view.scale * factor);
  }, { passive: false });

  svg.addEventListener("dblclick", resetZoom);

  svg.addEventListener("mousedown", (e) => {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    view.dragging = true;
    view.dragX = e.clientX;
    view.dragY = e.clientY;
    svg.classList.add("dragging");
    e.preventDefault();
  });

  svg.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("mousemove", (e) => {
    if (!view.dragging) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - view.dragX) * (view.w / rect.width);
    const dy = (e.clientY - view.dragY) * (view.h / rect.height);
    view.dragX = e.clientX;
    view.dragY = e.clientY;
    view.tx += dx;
    view.ty += dy;
    updateTransform();
  });

  window.addEventListener("mouseup", () => {
    if (!view.dragging) return;
    view.dragging = false;
    svg.classList.remove("dragging");
  });

  byId("toggleLabels").addEventListener("change", () => {
    svg.classList.toggle("hidden-label", !byId("toggleLabels").checked);
  });

  byId("toggleRisk").addEventListener("change", () => {
    svg.classList.toggle("risk-highlight", byId("toggleRisk").checked);
  });

  byId("toggleTiming").addEventListener("change", () => {
    svg.classList.toggle("timing-off", !byId("toggleTiming").checked);
  });

  byId("modeFilter").addEventListener("change", () => {
    userChangedMode = true;
    applyModeFilter();
  });

  if (meta.disableModeFilter) {
    const modeNode = byId("modeFilter");
    modeNode.value = "all";
    modeNode.disabled = true;
    modeNode.title = "该专题固定展示全部节点，避免筛选导致误判。";
    userChangedMode = false;
  }

  window.addEventListener("focus", forceFullMode);
  window.addEventListener("pageshow", forceFullMode);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) forceFullMode();
  });

  // Some browsers keep select state across reloads; always start from full view.
  forceFullMode();
  setTimeout(forceFullMode, 80);
  setTimeout(forceFullMode, 240);
  setTimeout(forceFullMode, 800);

  updateTransform();
}

function fillPageMeta() {
  const meta = window.TOPIC_META || {};
  byId("topicName").textContent = meta.name || "专题页";
  byId("topicSummary").textContent = meta.summary || "";
  byId("goalText").textContent = meta.goal || "-";
  byId("inText").textContent = meta.inputs || "-";
  byId("outText").textContent = meta.outputs || "-";
  byId("entryText").textContent = meta.entry || "-";
  byId("riskText").textContent = meta.risk || "-";
  byId("verifyText").textContent = meta.verify || "-";
  byId("phaseText").textContent = meta.phase || "功能架构";
  byId("footText").textContent = meta.foot || "该专题为骨架版本，后续会补充代码级证据与行号链接。";

  const tags = byId("tagWrap");
  (meta.tags || []).forEach((t) => {
    const s = document.createElement("span");
    s.className = "tag";
    s.textContent = t;
    tags.appendChild(s);
  });

  if (meta.stateMachineLink) {
    const link = byId("topicLink");
    link.style.display = "inline";
    link.href = meta.stateMachineLink;
  }
}

function listHtml(items, klass) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    return `<li class="${klass || ""}">待补充</li>`;
  }
  return safeItems.map((it) => `<li class="${klass || ""}">${it}</li>`).join("");
}

function renderDeepDive() {
  const meta = window.TOPIC_META || {};
  const main = document.querySelector("main.main");
  if (!main) return;

  const wrap = document.createElement("section");
  wrap.className = "deep-wrap";
  wrap.innerHTML = `
    <div class="deep-grid">
      <article class="deep-card">
        <h3>代码级节点（建议先看）</h3>
        <ul>${listHtml(meta.codeNodes, "code-node")}</ul>
      </article>
      <article class="deep-card">
        <h3>关键调用点/链路</h3>
        <ul>${listHtml(meta.keyCalls, "call-point")}</ul>
      </article>
      <article class="deep-card">
        <h3>函数级锚点（建议检索）</h3>
        <ul>${listHtml(meta.functionAnchors, "func-anchor")}</ul>
      </article>
      <article class="deep-card">
        <h3>搜索关键词</h3>
        <ul>${listHtml(meta.searchKeywords, "search-key")}</ul>
      </article>
      <article class="deep-card">
        <h3>时序与配置边界</h3>
        <ul>${listHtml(meta.boundaries, "boundary")}</ul>
      </article>
      <article class="deep-card">
        <h3>统一验证清单</h3>
        <ul>${listHtml(meta.checks, "check")}</ul>
      </article>
    </div>
  `;
  main.insertBefore(wrap, byId("footText"));
}

function renderQuickAnchorPanel() {
  const meta = window.TOPIC_META || {};
  const side = document.querySelector("aside.side");
  if (!side) return;

  const panel = document.createElement("div");
  panel.className = "group";
  panel.innerHTML = `
    <h3>函数锚点与检索</h3>
    <div class="side-sub">不滚动主画布即可快速定位阅读入口。</div>
    <div class="side-list-wrap">
      <div class="side-list-title">函数级锚点</div>
      <ul class="side-list">${listHtml(meta.functionAnchors, "func-anchor")}</ul>
      <div class="side-list-title">搜索关键词</div>
      <ul class="side-list">${listHtml(meta.searchKeywords, "search-key")}</ul>
    </div>
  `;

  const groups = side.querySelectorAll(".group");
  if (groups.length >= 2) {
    groups[1].insertAdjacentElement("afterend", panel);
  } else {
    side.appendChild(panel);
  }
}

function shortText(v, maxLen) {
  const s = (v || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
}

function escText(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanFlowLabel(v) {
  const s = (v || "").trim();
  if (!s) return "";
  const seg = s
    .replace(/^\d+\)\s*/, "")
    .split("::")[0]
    .split("->")
    .map((p) => p.trim())
    .filter(Boolean)
    .pop() || s;
  const noPath = seg.includes("/") ? seg.split("/").pop() : seg;
  return shortText(noPath.replace(/\.c$|\.h$/i, ""), 12);
}

function uniquePush(arr, seen, value) {
  const v = cleanFlowLabel(value);
  if (!v) return;
  if (seen.has(v)) return;
  seen.add(v);
  arr.push(v);
}

function deriveFlowTitles(meta) {
  const out = [];
  const seen = new Set();
  uniquePush(out, seen, meta.inputs);
  uniquePush(out, seen, meta.entry);
  (meta.keyCalls || []).forEach((v) => uniquePush(out, seen, v));
  uniquePush(out, seen, meta.outputs);
  (meta.boundaries || []).forEach((v) => uniquePush(out, seen, v));
  (meta.searchKeywords || []).forEach((v) => uniquePush(out, seen, v));

  const fallback = ["输入/触发", "逻辑处理", "执行动作", "周期/中断", "仲裁与限幅", "状态反馈", "诊断与记录"];
  while (out.length < 7) {
    out.push(fallback[out.length]);
  }
  return out.slice(0, 7);
}

function deriveEdgeLabels(meta) {
  const labels = (meta.keyCalls || [])
    .map((v) => {
      const p = (v || "").split(":");
      return p.length > 1 ? shortText(p[p.length - 1], 8) : shortText(v, 8);
    })
    .filter(Boolean);
  const fallback = ["主链", "输出", "触发", "时序影响", "反馈", "诊断路径", "参数回写"];

  while (labels.length < 7) {
    labels.push(fallback[labels.length]);
  }
  return labels.slice(0, 7);
}

function inferDiagramType(meta) {
  if (meta.diagramType) return meta.diagramType;
  const bag = `${meta.name || ""} ${(meta.tags || []).join(" ")} ${meta.summary || ""}`;
  if (/状态机|statemachine/i.test(bag)) return "state-machine";
  if (/三环|foc|采样|调度|通信|诊断|安全|参数|扭矩/i.test(bag)) return "swimlane";
  return "swimlane";
}

function deriveLaneTitles(meta) {
  if (Array.isArray(meta.laneTitles) && meta.laneTitles.length >= 3) {
    return meta.laneTitles.slice(0, 3);
  }
  const bag = `${meta.name || ""} ${(meta.tags || []).join(" ")}`;
  if (/三环|foc/i.test(bag)) {
    return ["传感与采样", "控制计算（FOC/环路）", "执行与反馈"];
  }
  if (/调度|中断|priority|task/i.test(bag)) {
    return ["中断入口", "周期任务链", "后台与诊断"];
  }
  if (/通信|uds|xcp|标定|参数/i.test(bag)) {
    return ["通信入口", "参数处理", "持久化与回读"];
  }
  if (/安全|fault|protect/i.test(bag)) {
    return ["故障检测", "仲裁与降级", "执行切断与复位"];
  }
  return ["输入与触发", "处理与仲裁", "执行与反馈"];
}

  function inferNodeDetails(meta, idx, title) {
    const preferred = [];
    const nodeDetailMap = meta.nodeDetails || {};
    const keyed = nodeDetailMap[title];
    if (Array.isArray(keyed) && keyed.length) {
      return keyed.map((v) => shortText(v, 24)).slice(0, 2);
    }

    (meta.keyCalls || []).forEach((v) => preferred.push(v));
    (meta.boundaries || []).forEach((v) => preferred.push(v));
    (meta.searchKeywords || []).forEach((v) => preferred.push(`关键词: ${v}`));

    if (!preferred.length) return [];

    const pickA = preferred[idx % preferred.length];
    const pickB = preferred[(idx + 3) % preferred.length];
    const normalize = (v) => {
      const raw = String(v || "").split("::").pop();
      const seg = raw.includes(":") ? raw.split(":").slice(1).join(":") : raw;
      return shortText(seg.trim() || raw.trim(), 24);
    };
    return [normalize(pickA), normalize(pickB)].filter(Boolean);
  }

  function drawNodeWithDetails(b, details) {
    const palette = {
      input: { fill: "#fff4dc", stroke: "#e59e23" },
      timing: { fill: "#e9f3ff", stroke: "#2d7ed0" },
      logic: { fill: "#edf5ff", stroke: "#3f83c4" },
      act: { fill: "#f1fbf5", stroke: "#23a06b" },
      feedback: { fill: "#f5f4ff", stroke: "#6b61d8" },
      diag: { fill: "#fff2f4", stroke: "#d55a72" }
    };
    const c = palette[b.mode] || { fill: "#ffffff", stroke: "#5c7da0" };
    const riskClass = b.risk ? "risk" : "";
    const titleY = b.y + 24;
    let detailSvg = "";

    details.slice(0, 2).forEach((line, i) => {
      detailSvg += `<text x="${b.x + b.w / 2}" y="${b.y + 42 + i * 14}" text-anchor="middle" fill="#385f83" font-size="10">${escText(line)}</text>`;
    });

    return `
      <g data-mode="${b.mode}">
        <rect class="${riskClass}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10" fill="${c.fill}" stroke="${c.stroke}"/>
        <text x="${b.x + b.w / 2}" y="${titleY}" text-anchor="middle" fill="#143b5f" font-size="13" font-weight="700">${escText(b.title)}</text>
        ${detailSvg}
      </g>
    `;
  }

  function buildFallbackNodes(meta) {
    const flowTitles = deriveFlowTitles(meta);
    return [
      { x: 96, y: 120, w: 270, h: 84, title: flowTitles[0], mode: "input", risk: false },
      { x: 500, y: 120, w: 270, h: 84, title: flowTitles[1], mode: "logic", risk: false },
      { x: 904, y: 120, w: 270, h: 84, title: flowTitles[2], mode: "timing", risk: true },
      { x: 96, y: 314, w: 270, h: 84, title: flowTitles[3], mode: "logic", risk: true },
      { x: 500, y: 314, w: 270, h: 84, title: flowTitles[4], mode: "act", risk: true },
      { x: 904, y: 314, w: 270, h: 84, title: flowTitles[5], mode: "feedback", risk: false },
      { x: 500, y: 506, w: 270, h: 84, title: flowTitles[6], mode: "diag", risk: false }
    ];
  }

  function buildFallbackEdges(meta) {
    const labels = deriveEdgeLabels(meta);
    return [
      [366, 162, 500, 162, labels[0]],
      [770, 162, 904, 162, labels[1]],
      [230, 204, 230, 314, labels[2]],
      [366, 356, 500, 356, labels[3]],
      [770, 356, 904, 356, labels[4]],
      [1040, 398, 640, 506, labels[5]],
      [640, 506, 640, 398, labels[6]]
    ];
  }

  function drawSwimlane(svg, meta) {
    const laneColor = ["#fff8ec", "#eef6ff", "#eefaf2"];
    const laneTitle = deriveLaneTitles(meta);
    const box = Array.isArray(meta.flowNodes) && meta.flowNodes.length ? meta.flowNodes : buildFallbackNodes(meta);
    const edges = Array.isArray(meta.flowEdges) && meta.flowEdges.length ? meta.flowEdges : buildFallbackEdges(meta);

    let lanes = "";
    for (let i = 0; i < 3; i++) {
      const lx = 56 + i * 390;
      lanes += `<rect class="timing-lane" x="${lx}" y="62" width="368" height="598" fill="${laneColor[i]}" stroke="#d7e6f4"/>`;
      lanes += `<rect class="timing-lane" x="${lx}" y="62" width="368" height="44" fill="#ffffff" stroke="#d7e6f4"/>`;
      lanes += `<text x="${lx + 184}" y="89" text-anchor="middle" font-size="13" font-weight="700" fill="#2d4f73">${escText(laneTitle[i])}</text>`;
    }

    let nodes = "";
    box.forEach((b, idx) => {
      const n = { ...b };
      if (!n.h || n.h < 74) n.h = 84;
      const details = Array.isArray(n.details) && n.details.length ? n.details : inferNodeDetails(meta, idx, n.title);
      nodes += drawNodeWithDetails(n, details);
    });

    let edgeSvg = "";
    edges.forEach((e) => {
      const [x1, y1, x2, y2, t] = e;
      const label = String(t || "");
      const isFeedback = /反馈|回写|闭环|feedback/i.test(label);
      const stroke = isFeedback ? "#7a56d8" : "#4f6984";
      const dash = isFeedback ? ' stroke-dasharray="6 4"' : "";
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      edgeSvg += `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="1.45"${dash} marker-end="url(#arr)"/>`;
      edgeSvg += `<text class="evt-label" x="${mx}" y="${my - 6}" fill="#47627d" font-size="10" text-anchor="middle">${escText(label)}</text>`;
    });

    svg.innerHTML = `
      <defs>
        <marker id="arr" markerWidth="11" markerHeight="11" refX="10" refY="5.5" orient="auto">
          <path d="M0,0 L11,5.5 L0,11 Z" fill="#4b6178"/>
        </marker>
      </defs>
      <g id="viewport">${lanes}${edgeSvg}${nodes}</g>
    `;
  }

  function drawStateMachine(svg, meta) {
    const box = Array.isArray(meta.flowNodes) && meta.flowNodes.length ? meta.flowNodes : buildFallbackNodes(meta);
    const edges = Array.isArray(meta.flowEdges) && meta.flowEdges.length ? meta.flowEdges : buildFallbackEdges(meta);

    let bg = "";
    bg += `<rect x="48" y="48" width="1184" height="624" rx="14" fill="#f7fbff" stroke="#d4e3f2"/>`;
    bg += `<text x="76" y="82" font-size="12" fill="#5a7898">状态迁移图（细化版）：环形自检 / 条件迁移 / 故障跳转</text>`;

    let nodes = "";
    box.forEach((b, idx) => {
      const n = { ...b };
      if (!n.h || n.h < 66) n.h = 70;
      const details = Array.isArray(n.details) && n.details.length ? n.details : inferNodeDetails(meta, idx, n.title).slice(0, 1);
      nodes += drawNodeWithDetails(n, details);

      const loopCx = n.x + n.w / 2;
      const loopTop = n.y - 26;
      nodes += `<path d="M ${loopCx - 56} ${n.y + 2} C ${loopCx - 56} ${loopTop}, ${loopCx + 56} ${loopTop}, ${loopCx + 56} ${n.y + 2}" fill="none" stroke="#7388a3" stroke-width="1.3" marker-end="url(#arr)"/>`;
    });

    let edgeSvg = "";
    edges.forEach((e) => {
      const [x1, y1, x2, y2, t] = e;
      const label = String(t || "");
      const riskEdge = /fault|故障|危险|risk/i.test(label);
      const stroke = riskEdge ? "#c2412d" : "#516b86";
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const offset = Math.abs(x2 - x1) > 220 ? 54 : 34;
      const cy = my - offset;
      edgeSvg += `<path d="M ${x1} ${y1} Q ${mx} ${cy} ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="1.55" marker-end="url(#arr)"/>`;
      edgeSvg += `<text class="evt-label" x="${mx}" y="${cy - 4}" fill="#4c6783" font-size="10" text-anchor="middle">${escText(label)}</text>`;
    });

    svg.innerHTML = `
      <defs>
        <marker id="arr" markerWidth="11" markerHeight="11" refX="10" refY="5.5" orient="auto">
          <path d="M0,0 L11,5.5 L0,11 Z" fill="#4b6178"/>
        </marker>
      </defs>
      <g id="viewport">${bg}${edgeSvg}${nodes}</g>
    `;
  }

function drawSkeleton() {
  const svg = byId("diagramSvg");
  const meta = window.TOPIC_META || {};
  const kind = inferDiagramType(meta);
  if (kind === "state-machine") {
    drawStateMachine(svg, meta);
    return;
  }
  drawSwimlane(svg, meta);
}

window.addEventListener("DOMContentLoaded", () => {
  fillPageMeta();
  drawSkeleton();
  bindViewport();
  renderQuickAnchorPanel();
  renderDeepDive();
});
