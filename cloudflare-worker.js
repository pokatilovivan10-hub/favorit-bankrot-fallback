const allowedOrigins = new Set([
  "https://favorit-bankrot.site",
  "https://www.favorit-bankrot.site",
]);

function response(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return allowedOrigins.has(origin)
        ? response({ ok: true }, 204, origin)
        : response({ error: "Forbidden" }, 403);
    }

    if (request.method !== "POST" || !allowedOrigins.has(origin)) {
      return response({ error: "Forbidden" }, 403);
    }

    try {
      const data = await request.json();
      const name = String(data.name || "").trim();
      const phone = String(data.phone || "").trim();
      const message = String(data.message || "").trim();

      if (phone.replace(/\D/g, "").length < 10) {
        return response({ error: "Укажите корректный телефон" }, 400, origin);
      }

      const fields = {
        TITLE: "Заявка с favorit-bankrot.site",
        NAME: name || "Не указано",
        PHONE: [{ VALUE: phone, VALUE_TYPE: "WORK" }],
        COMMENTS: [message, "Источник: Иван Покатилов"].filter(Boolean).join("\n"),
        SOURCE_DESCRIPTION: "Иван Покатилов",
      };

      const bitrixUrl = new URL("crm.lead.add.json", env.BITRIX_WEBHOOK_URL);
      const bitrixResponse = await fetch(bitrixUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      const bitrix = await bitrixResponse.json();

      if (!bitrixResponse.ok || !bitrix.result) {
        return response({ error: "Не удалось отправить заявку" }, 502, origin);
      }

      return response({ ok: true, leadId: bitrix.result }, 200, origin);
    } catch {
      return response({ error: "Некорректные данные" }, 400, origin);
    }
  },
};
