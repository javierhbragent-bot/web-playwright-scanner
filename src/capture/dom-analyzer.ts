import type { Page } from "playwright";
import type { DomSnapshot } from "../types/dom.js";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("dom-analyzer");

export async function analyzeDom(page: Page): Promise<DomSnapshot> {
  log.debug({ url: page.url() }, "Analyzing DOM");

  return page.evaluate(() => {
    function getSelector(el: Element): string {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList).join(".");
      if (classes) return `${tag}.${classes}`;
      const parent = el.parentElement;
      if (!parent) return tag;
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === el.tagName,
      );
      if (siblings.length === 1) return `${parent.tagName.toLowerCase()} > ${tag}`;
      const index = siblings.indexOf(el) + 1;
      return `${tag}:nth-of-type(${index})`;
    }

    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    ).map((el) => ({
      level: parseInt(el.tagName[1]),
      text: (el.textContent ?? "").trim(),
    }));

    const buttons = Array.from(
      document.querySelectorAll(
        'button, [role="button"], input[type="submit"], input[type="button"]',
      ),
    ).map((el) => ({
      text:
        (el.textContent ?? "").trim() ||
        (el as HTMLInputElement).value ||
        "",
      selector: getSelector(el),
      disabled: (el as HTMLButtonElement).disabled ?? false,
    }));

    const links = Array.from(document.querySelectorAll("a[href]")).map(
      (el) => ({
        text: (el.textContent ?? "").trim(),
        href: (el as HTMLAnchorElement).href,
        selector: getSelector(el),
      }),
    );

    const forms = Array.from(document.querySelectorAll("form")).map((form) => {
      const inputs = Array.from(
        form.querySelectorAll("input, select, textarea"),
      ).map((input) => {
        const el = input as HTMLInputElement;
        const labelEl = el.id
          ? document.querySelector(`label[for="${el.id}"]`)
          : null;
        return {
          name: el.name || el.id || "",
          type: el.type || el.tagName.toLowerCase(),
          label: labelEl?.textContent?.trim() ?? el.placeholder ?? undefined,
          required: el.required ?? false,
          value: el.type === "password" ? undefined : el.value || undefined,
        };
      });
      return {
        selector: getSelector(form),
        action: (form as HTMLFormElement).action || undefined,
        method: (form as HTMLFormElement).method || undefined,
        inputs,
      };
    });

    const tables = Array.from(document.querySelectorAll("table")).map(
      (table) => ({
        selector: getSelector(table),
        headers: Array.from(table.querySelectorAll("th")).map(
          (th) => (th.textContent ?? "").trim(),
        ),
        rowCount: table.querySelectorAll("tbody tr").length,
      }),
    );

    const dialogs = Array.from(
      document.querySelectorAll('dialog, [role="dialog"], .modal'),
    ).map((el) => {
      const titleEl = el.querySelector(
        '[class*="title"], h1, h2, h3, [class*="header"]',
      );
      return {
        open:
          (el as HTMLDialogElement).open ??
          el.classList.contains("show") ??
          getComputedStyle(el).display !== "none",
        title: titleEl?.textContent?.trim() ?? undefined,
        selector: getSelector(el),
      };
    });

    const alerts = Array.from(
      document.querySelectorAll(
        '[role="alert"], .alert, .notification, .toast, .message',
      ),
    ).map((el) => ({
      text: (el.textContent ?? "").trim(),
      type:
        el.className.match(
          /alert-(\w+)|notification-(\w+)|toast-(\w+)/,
        )?.[1] ?? undefined,
      selector: getSelector(el),
    }));

    return { headings, buttons, links, forms, tables, dialogs, alerts };
  });
}
