"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TOKEN_KEY = "pp_token";


const DEFAULT_ENDPOINT = (process.env.NEXT_PUBLIC_API_BASE || "/api") + "/chatbot/message";

export default function ChatWidget({ endpoint = DEFAULT_ENDPOINT, brandName = "PicklePickle" }) {
    const pathname = usePathname();

    // Ẩn ở auth pages cho gọn (bạn có thể bỏ nếu muốn)
    const shouldHide = useMemo(() => {
        if (!pathname) return false;
        return (
            pathname.startsWith("/login") ||
            pathname.startsWith("/register") ||
            pathname.startsWith("/verify")
        );
    }, [pathname]);

    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [input, setInput] = useState("");


    const [chatContext, setChatContext] = useState({});

    const [messages, setMessages] = useState(() => [
        {
            id: rid(),
            role: "assistant",
            text: `Chào bạn! Mình có thể gợi ý sân, giờ mở cửa, giá và kiểm tra khung giờ trống.`,
            ts: Date.now(),
        },
    ]);

    const listRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages, open]);

    // Nếu bạn có event logout trong app thì phát event này để widget reset (optional)
    useEffect(() => {
        const handler = () => {
            const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
            if (!token) {
                setMessages([
                    {
                        id: rid(),
                        role: "assistant",
                        text: "Bạn đã đăng xuất. Nếu cần hỗ trợ cứ nhắn mình nhé!",
                        ts: Date.now(),
                    },
                ]);
                setChatContext({});
                setOpen(false);
                setInput("");
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("pp-auth-changed", handler);
            return () => window.removeEventListener("pp-auth-changed", handler);
        }
    }, []);

    const quickChips = useMemo(
        () => [
            { label: "Sân gần mình", value: "Mình đang ở Thủ Đức, gợi ý giúp vài sân gần mình." },
            { label: "Kiểm tra sân trống", value: "Tối nay 20h còn sân trống không? Mình ở Thủ Đức." },
            { label: "Giờ mở cửa", value: "Hôm nay sân mở đến mấy giờ? Mình ở Thủ Đức." },
            { label: "Giá rẻ", value: "Mình ở Thủ Đức, đề xuất vài sân giá rẻ giúp mình." },
        ],
        []
    );

    if (shouldHide) return null;

    async function send(text) {
        const content = (text || "").trim();
        if (!content || busy) return;

        setMessages((prev) => [
            ...prev,
            { id: rid(), role: "user", text: content, ts: Date.now() },
        ]);
        setInput("");
        setBusy(true);

        try {
            const { reply, context } = await callChatbotApi({
                endpoint,
                message: content,
                context: chatContext,
            });

            const finalText =
                reply && typeof reply === "string" && reply.trim()
                    ? reply
                    : localReply(content, chatContext);

            setMessages((prev) => [
                ...prev,
                { id: rid(), role: "assistant", text: finalText, ts: Date.now() },
            ]);

            if (context && typeof context === "object") setChatContext(context);
        } catch {
            const finalText = localReply(content, chatContext);
            setMessages((prev) => [
                ...prev,
                { id: rid(), role: "assistant", text: finalText, ts: Date.now() },
            ]);
        } finally {
            setBusy(false);
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        send(input);
    }

    return (
        <div className="fixed bottom-5 right-5 z-[9999]">

            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-black shadow-xl hover:shadow-2xl active:scale-[0.98] transition"
                    aria-label="Mở chat"
                    title="Hỗ trợ"
                >
                    <span className="text-white text-lg">💬</span>
                    <span className="pointer-events-none absolute -left-[140px] top-1/2 hidden -translate-y-1/2 rounded-full bg-white px-3 py-1 text-xs text-black shadow-md group-hover:block">
                        Hỗ trợ nhanh
                    </span>
                </button>
            )}

            {open && (
                <div className="w-[460px] max-w-[96vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                    {/* Header: đen như bạn muốn */}
                    <div className="flex items-center justify-between gap-3 bg-black px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                <div className="truncate font-semibold text-white">Trợ lý {brandName}</div>
                            </div>
                            <div className="truncate text-xs text-white/70">
                                Tư vấn sân, giá, giờ mở cửa, khung giờ trống
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/15"
                            aria-label="Đóng chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Quick chips (ngắn gọn, nền trắng) */}
                    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-black/5">

                        {quickChips.map((c) => (
                            <button
                                key={c.label}
                                type="button"
                                onClick={() => send(c.value)}
                                className="shrink-0 rounded-full border border-black/10 bg-gray-50 px-3 py-1 text-xs text-gray-900 hover:bg-gray-100"
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    {/* Messages (nền trắng, chữ đen, scroll đẹp) */}
                    <div
                        ref={listRef}
                        className="pp-chat-scroll h-[380px] overflow-y-auto px-4 py-3"
                    >
                        <div className="space-y-3">
                            {messages.map((m) => (
                                <Bubble key={m.id} role={m.role} text={m.text} />
                            ))}
                            {busy && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-700">
                                        Đang trả lời…
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input (bỏ dòng “Mẹo:”) */}
                    <form onSubmit={onSubmit} className="border-t border-black/10 p-3">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Hỏi gì đó…"
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 outline-none focus:border-black/25"
                                disabled={busy}
                            />
                            <button
                                type="submit"
                                disabled={busy || !input.trim()}
                                className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-black/90 disabled:opacity-50"
                            >
                                Gửi
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function Bubble({ role, text }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={[
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    isUser
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black",
                ].join(" ")}
            >
                {text}
            </div>
        </div>
    );
}

async function callChatbotApi({ endpoint, message, context }) {
    if (!endpoint) return { reply: "", context };

    const token =
        typeof window !== "undefined" ? localStorage.getItem("pp_token") : null;

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, context }),
    });

    if (!res.ok) return { reply: "", context };

    const data = await res.json().catch(() => ({}));
    return {
        reply: data?.reply || "",
        context: data?.context || context,
    };
}

/**
 * Fallback rất nhẹ nếu backend chưa chạy.
 * (khi backend ok thì gần như không dùng)
 */
function localReply(msg, ctx) {
    const s = (msg || "").toLowerCase();

    // user chỉ trả lời khu vực (VD: "Q7", "Thủ Đức")
    if (looksLikeLocationOnly(s)) {
        return "Ok! Bạn muốn mình ưu tiên tiêu chí nào: giá rẻ, sân gần, hay kiểm tra khung giờ trống?";
    }

    if (/(xin chào|chào|hello|hi|hey)/i.test(s)) {
        return "Chào bạn! Bạn đang ở khu vực/quận nào để mình gợi ý chính xác hơn?";
    }
    if (/(mở cửa|đóng cửa|giờ mở|giờ đóng)/i.test(s)) {
        return ctx?.district
            ? `Ok, bạn muốn hỏi giờ hoạt động của sân gần ${ctx.district} đúng không?`
            : "Bạn đang ở khu vực nào để mình trả lời giờ mở/đóng gần bạn nhé?";
    }
    if (/(giá|rẻ|bao nhiêu|phí)/i.test(s)) {
        return ctx?.district
            ? `Ok, mình sẽ gợi ý vài sân giá tốt gần ${ctx.district}.`
            : "Bạn đang ở khu vực nào (VD: Thủ Đức, Quận 7) để mình gợi ý sân giá tốt?";
    }
    if (/(còn sân|trống|khung giờ|20h|21h|19h)/i.test(s)) {
        return ctx?.district
            ? `Ok, mình sẽ kiểm tra khung giờ gần ${ctx.district}. Bạn muốn ngày nào và mấy giờ?`
            : "Bạn đang ở khu vực nào và muốn ngày/giờ nào để mình check sân trống?";
    }
    return "Bạn đang ở khu vực/quận nào để mình hỗ trợ tốt hơn?";
}

function looksLikeLocationOnly(s) {
    const t = s.trim();
    if (!t) return false;
    // “q7”, “quận 7”, “thu duc”, “thủ đức”
    if (/^(q\s?\d{1,2}|quận\s?\d{1,2})$/i.test(t)) return true;
    if (/^(thủ đức|thu duc)$/i.test(t)) return true;
    return false;
}

function rid() {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}
