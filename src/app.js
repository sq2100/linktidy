import { cleanBatch } from "./core.js";
import {
  $,
  init,
  message,
  table,
  stats,
  csv,
  download,
  textImport,
  guard,
  ready,
} from "./ui.js";
init();
let rows = [];
function run() {
  rows = cleanBatch($("source").value);
  stats([
    ["Links", rows.length],
    ["Cleaned", rows.filter((r) => r.status === "Cleaned").length],
    ["Parameters removed", rows.reduce((n, r) => n + r.removed.length, 0)],
    [
      "Review / skipped",
      rows.filter((r) => !["Cleaned", "Unchanged"].includes(r.status)).length,
    ],
  ]);
  table(
    ["Status", "Clean link", "Removed parameters"],
    rows.map((r) => [r.status, r.cleaned, r.removed.join(", ") || "—"]),
  );
  $("cleaned").value = rows.map((r) => r.cleaned).join("\n");
  message(
    "Only known query parameters were removed. Skipped links are preserved verbatim. No URLs were opened.",
  );
  ready();
}
$("run").onclick = guard(run);
textImport("file-source", "source", () =>
  document
    .querySelectorAll("[data-export]")
    .forEach((b) => (b.disabled = true)),
);
$("export").onclick = () =>
  download(rows.map((r) => r.cleaned).join("\n") + "\n", "linktidy-links.txt");
$("report").onclick = () =>
  download(
    csv([
      ["status", "original", "cleaned", "removed"],
      ...rows.map((r) => [
        r.status,
        r.original,
        r.cleaned,
        r.removed.join("; "),
      ]),
    ]),
    "linktidy-report.csv",
    "text/csv;charset=utf-8",
  );
$("demo").onclick = guard(() => {
  $("source").value =
    "https://example.com/article?utm_source=newsletter&utm_campaign=fall&id=42#details\nhttps://example.org/watch?v=abc&fbclid=demo-click-id\nhttps://example.com/download?token=demo-token&utm_source=email\nhttps://example.org/docs?lang=en";
  run();
});
