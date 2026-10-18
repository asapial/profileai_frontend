import * as THREE from "three";

export type DocumentTextureKind =
  | "resume"
  | "raw"
  | "tailored"
  | "alignment"
  | "tracker"
  | "editorial"
  | "technical"
  | "minimal"
  | "grid";

const ink = "#24153d";
const violet = "#7c3aed";
const mist = "#f7f3ff";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function lines(ctx: CanvasRenderingContext2D, x: number, y: number, widths: number[], color = "#d9d1e4", gap = 34) {
  ctx.fillStyle = color;
  widths.forEach((width, index) => {
    roundedRect(ctx, x, y + index * gap, width, 9, 5);
    ctx.fill();
  });
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = violet) {
  ctx.fillStyle = color;
  ctx.font = "700 29px Arial";
  ctx.letterSpacing = "5px";
  ctx.fillText(text.toUpperCase(), x, y);
}

function resumeBase(ctx: CanvasRenderingContext2D, accent: string, technical = false, minimal = false) {
  ctx.fillStyle = minimal ? "#fffdf9" : "#ffffff";
  ctx.fillRect(0, 0, 2048, 2048);
  if (!minimal) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, technical ? 170 : 48, 2048);
  }
  ctx.fillStyle = ink;
  ctx.font = "600 91px Georgia";
  ctx.fillText("Alex Morgan", 190, 230);
  ctx.fillStyle = accent;
  ctx.font = "700 30px Arial";
  ctx.letterSpacing = "7px";
  ctx.fillText("SENIOR FRONTEND ENGINEER", 194, 292);
  ctx.fillStyle = "#766c80";
  ctx.font = "28px Arial";
  ctx.letterSpacing = "0px";
  ctx.fillText("alex.morgan@example.com  ·  New York, NY", 194, 350);
  ctx.fillStyle = "#e9e2ef";
  ctx.fillRect(194, 402, 1660, 3);
  label(ctx, "Profile", 194, 492, accent);
  ctx.fillStyle = ink;
  ctx.font = "34px Georgia";
  ctx.fillText("Design-minded engineer building clear, durable product systems", 194, 558);
  ctx.fillText("across complex front-end platforms and collaborative teams.", 194, 606);
  label(ctx, "Experience", 194, 736, accent);
  ctx.fillStyle = ink;
  ctx.font = "700 38px Arial";
  ctx.fillText("Lead Frontend Engineer", 194, 810);
  ctx.fillStyle = "#776d81";
  ctx.font = "29px Arial";
  ctx.fillText("Northstar Systems  ·  2022 — Present", 194, 857);
  lines(ctx, 226, 930, [1510, 1440, 1370], "#cfc7d7", 42);
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(202, 935, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(202, 977, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(202, 1019, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = "700 38px Arial";
  ctx.fillText("Frontend Engineer", 194, 1142);
  ctx.fillStyle = "#776d81";
  ctx.font = "29px Arial";
  ctx.fillText("Helio Labs  ·  2019 — 2022", 194, 1189);
  lines(ctx, 226, 1260, [1500, 1300, 1420], "#cfc7d7", 42);
  label(ctx, "Selected systems", 194, 1482, accent);
  const skills = ["React architecture", "Design systems", "Accessibility", "Performance"];
  skills.forEach((skill, i) => {
    const x = 194 + (i % 2) * 760;
    const y = 1535 + Math.floor(i / 2) * 92;
    roundedRect(ctx, x, y, 650, 62, 31);
    ctx.fillStyle = mist;
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = "700 25px Arial";
    ctx.fillText(skill, x + 29, y + 40);
  });
  ctx.fillStyle = "#eee8f2";
  ctx.fillRect(194, 1845, 1660, 2);
  ctx.fillStyle = "#85798e";
  ctx.font = "24px Arial";
  ctx.fillText("VERIFIED FROM 3 SOURCE DOCUMENTS", 194, 1906);
  ctx.fillStyle = accent;
  ctx.font = "700 24px Arial";
  ctx.fillText("PROFILEAI / 01", 1630, 1906);
}

export function createResumeTexture(kind: DocumentTextureKind, anisotropy = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");

  ctx.scale(0.5, 0.5);
  ctx.textRendering = "geometricPrecision";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 2048, 2048);

  if (["resume", "editorial", "technical", "minimal", "grid"].includes(kind)) {
    const accents: Record<string, string> = { resume: violet, editorial: "#5a2f82", technical: "#5330d0", minimal: "#30213f", grid: "#8b5cf6" };
    resumeBase(ctx, accents[kind], kind === "technical", kind === "minimal");
    if (kind === "grid") {
      ctx.strokeStyle = "rgba(124,58,237,.1)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 2048; i += 128) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 2048); ctx.stroke(); }
    }
  } else if (kind === "raw" || kind === "tailored") {
    const tailored = kind === "tailored";
    ctx.fillStyle = tailored ? "#ffffff" : "#f0edf4";
    ctx.fillRect(0, 0, 2048, 2048);
    label(ctx, tailored ? "After · Tailored impact" : "Before · Raw project note", 150, 220, tailored ? violet : "#867a91");
    ctx.fillStyle = ink;
    ctx.font = tailored ? "66px Georgia" : "58px Arial";
    const copy = tailored
      ? ["Led a design-system migration", "across a complex React platform,", "aligning engineering and design", "around accessible shared patterns."]
      : ["Worked on design system stuff.", "Moved old components over.", "Helped frontend team coordinate", "with designers on the migration."];
    copy.forEach((line, i) => ctx.fillText(line, 150, 460 + i * 100));
    lines(ctx, 150, 1010, tailored ? [1660, 1500, 1580, 1240] : [1200, 1600, 1050, 1440], tailored ? "#c9b8e5" : "#d2ccd8", 58);
    if (tailored) {
      roundedRect(ctx, 150, 1440, 850, 160, 34); ctx.fillStyle = "#efe7ff"; ctx.fill();
      ctx.fillStyle = violet; ctx.font = "700 48px Arial"; ctx.fillText("94% ROLE ALIGNMENT", 205, 1540);
    }
  } else if (kind === "alignment") {
    ctx.fillStyle = "#fbf9ff"; ctx.fillRect(0, 0, 2048, 2048);
    label(ctx, "Job alignment", 150, 200);
    ctx.fillStyle = ink; ctx.font = "82px Georgia"; ctx.fillText("Senior Frontend Engineer", 150, 310);
    ctx.fillStyle = violet; ctx.font = "700 190px Arial"; ctx.fillText("94%", 150, 630);
    ctx.fillStyle = "#786c82"; ctx.font = "30px Arial"; ctx.fillText("Strong evidence across the role's highest-priority signals", 150, 700);
    ["Design systems", "React architecture", "Cross-functional leadership", "Accessibility"].forEach((item, i) => {
      const y = 870 + i * 220; ctx.fillStyle = ink; ctx.font = "700 35px Arial"; ctx.fillText(item, 150, y);
      roundedRect(ctx, 150, y + 55, 1600, 30, 15); ctx.fillStyle = "#e8e0ef"; ctx.fill();
      roundedRect(ctx, 150, y + 55, 1230 + i * 90, 30, 15); ctx.fillStyle = i === 3 ? "#a78bfa" : violet; ctx.fill();
    });
  } else {
    ctx.fillStyle = "#f9f6ff"; ctx.fillRect(0, 0, 2048, 2048);
    label(ctx, "Application tracker", 150, 200);
    ctx.fillStyle = ink; ctx.font = "82px Georgia"; ctx.fillText("Your next moves", 150, 310);
    const cols = [["DISCOVERED", "Luma Labs", "Northstar"], ["PREPARING", "Orchid AI", "Linear"], ["CONVERSATION", "Vercel", "Arc Studio"]];
    cols.forEach((col, i) => {
      const x = 110 + i * 635;
      roundedRect(ctx, x, 450, 570, 1350, 34); ctx.fillStyle = i === 1 ? "#efe8ff" : "#f0ecf3"; ctx.fill();
      ctx.fillStyle = violet; ctx.font = "700 28px Arial"; ctx.fillText(col[0], x + 42, 525);
      col.slice(1).forEach((job, j) => {
        roundedRect(ctx, x + 30, 620 + j * 390, 510, 310, 25); ctx.fillStyle = "#fff"; ctx.fill();
        ctx.fillStyle = ink; ctx.font = "700 40px Arial"; ctx.fillText(job, x + 65, 700 + j * 390);
        ctx.fillStyle = "#807486"; ctx.font = "28px Arial"; ctx.fillText(j ? "Follow-up ready" : "Resume tailored", x + 65, 770 + j * 390);
        ctx.fillStyle = violet; ctx.beginPath(); ctx.arc(x + 470, 850 + j * 390, 12, 0, Math.PI * 2); ctx.fill();
      });
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
