// src/pages/Dashboard/BlogsEditor/index.tsx
import { useEffect, useRef, useState } from "react";
import {
    Box, IconButton, Stack, Tooltip, Typography, Divider,
    TextField, MenuItem, Select, FormControl, InputLabel, type SelectChangeEvent,
} from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import CustomInput from "../../../components/CustomInput/CustomInput";
import {
    FormatBold, FormatItalic, FormatUnderlined,
    FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
    FormatListBulleted, FormatListNumbered, Link as LinkIcon,
    Undo, Redo, TextDecreaseOutlined, TextIncreaseOutlined,
    ArrowBackIos,
} from "@mui/icons-material";
import { GOOGLE_FONTS } from "../../../constant/data";
import LandingButton from "../../../components/LandingButton/LandingButton";
import { fetchBlogById, saveBlog, updateBlog } from "../../../source/source";
import { useNavigate, useSearchParams } from "react-router-dom";

/** selection memory */
let lastRange: Range | null = null;
const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    lastRange = sel.getRangeAt(0).cloneRange();
};
const restoreSelection = () => {
    if (!lastRange) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(lastRange);
    return true;
};
const enableCssMode = () => document.execCommand("styleWithCSS", false, "true");

/** caret after node so new typing doesn't inherit style */
const moveCaretAfter = (node: Node) => {
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.setStartAfter(node);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    lastRange = r.cloneRange();
};

/** Wrap current selection with a span and return it */
const wrapSelection = (styler: (span: HTMLSpanElement) => void): HTMLSpanElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return null;

    const span = document.createElement("span");
    styler(span);

    try {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        return span;
    } catch {
        // fallback via insertHTML
        const container = document.createElement("div");
        container.appendChild(range.cloneContents());
        const tmp = document.createElement("span");
        styler(tmp);
        tmp.innerHTML = container.innerHTML;
        document.execCommand("insertHTML", false, tmp.outerHTML);
        // can't easily get reference; return null -> we'll try to find it by query later
        return null;
    }
};

const BlogsEditor = () => {

    const [search] = useSearchParams();
    const blogId = search.get("id");
    const navigate = useNavigate()

    const editorRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);

    const [title, setTitle] = useState("");
    const [foreColor, setForeColor] = useState("#111111");
    const [fontPx, setFontPx] = useState<number>(16);
    const [fontFamily, setFontFamily] = useState<string>(GOOGLE_FONTS[0] ?? "Dancing Script");

    const [selectionActive, setSelectionActive] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    const [loading, setLoading] = useState(false);
    console.log(selectionActive)


    // initial content
    useEffect(() => {
        if (initializedRef.current) return;
        if (editorRef.current) {
            editorRef.current.innerHTML = "<p>Write your blog…</p>";
            initializedRef.current = true;
        }
    }, []);

    // load Google fonts
    useEffect(() => {
        if (!GOOGLE_FONTS.length) return;
        const id = "editor-google-fonts";
        if (!document.getElementById(id)) {
            const families = GOOGLE_FONTS.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`).join("&");
            const link = document.createElement("link");
            link.id = id; link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
            document.head.appendChild(link);
        }
    }, []);

    // monitor selection; only active when inside editor & non-collapsed; update command states
    useEffect(() => {
        const onSel = () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                setSelectionActive(false);
                setIsBold(false); setIsItalic(false); setIsUnderline(false);
                return;
            }
            const range = sel.getRangeAt(0);
            const ed = editorRef.current;
            const inside =
                ed &&
                range.startContainer &&
                range.endContainer &&
                ed.contains(range.startContainer) &&
                ed.contains(range.endContainer);

            const active = !!inside && !sel.isCollapsed;
            setSelectionActive(active);
            if (inside) {
                // reflect state at caret even if collapsed
                setIsBold(document.queryCommandState("bold"));
                setIsItalic(document.queryCommandState("italic"));
                setIsUnderline(document.queryCommandState("underline"));
                saveSelection();
            }
        };
        document.addEventListener("selectionchange", onSel);
        return () => document.removeEventListener("selectionchange", onSel);
    }, []);

    const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
    const focusEditor = () => editorRef.current?.focus();

    const exec = (cmd: string, value?: string) => {
        focusEditor();
        enableCssMode();
        restoreSelection();
        document.execCommand(cmd, false, value);
        saveSelection();
    };

    // ---------- inline style appliers (selection-only, then move caret out) ----------
    const applyForeColor = (color: string) => {
        focusEditor();
        enableCssMode();
        if (!restoreSelection()) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        // try execCommand
        const ok = document.execCommand("foreColor", false, color);

        let styled: HTMLElement | null = null;
        if (!ok) styled = wrapSelection((s) => (s.style.color = color));

        // if unknown, try to find a color span near caret
        if (!styled) {
            const node = window.getSelection()!.anchorNode!;
            styled = (node?.parentElement?.closest("span[style*='color']") ?? null) as HTMLElement | null;
        }
        if (styled) moveCaretAfter(styled);
    };

    const setFontSizePx = (px: number) => {
        focusEditor();
        enableCssMode();
        if (!restoreSelection()) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        // try to reuse an existing styled span
        const range = sel.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const el =
            node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node.parentElement as HTMLElement | null);
        const existingSpan = el?.closest("span[style]") as HTMLElement | null;

        if (existingSpan && editorRef.current?.contains(existingSpan)) {
            existingSpan.style.fontSize = `${px}px`;
            moveCaretAfter(existingSpan);
            return;
        }

        const wrapped = wrapSelection((s) => (s.style.fontSize = `${px}px`));
        if (wrapped) moveCaretAfter(wrapped);
    };

    const applyFontSize = (px: number) => {
        const clamped = clamp(px, 8, 120);
        setFontPx(clamped);           // UI only
        setFontSizePx(clamped);       // selection-only
    };

    const applyFontFamily = (family: string) => {
        setFontFamily(family);        // UI only (does not affect default typing)
        focusEditor();
        enableCssMode();
        if (!restoreSelection()) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        // fontName might insert <font>; we still move caret after whatever we can find
        const ok = document.execCommand("fontName", false, family);

        let target: HTMLElement | null = null;
        if (!ok) target = wrapSelection((s) => (s.style.fontFamily = `'${family}', sans-serif`));
        if (!target) {
            const node = window.getSelection()!.anchorNode!;
            target = (node?.parentElement?.closest("span[style*='font-family'],font") ??
                node?.parentElement) as HTMLElement | null;
        }
        if (target) moveCaretAfter(target);
    };

    // toggles: bold, italic, underline — apply on selection only; caret moved out automatically by browser
    const toggleCmdSelectionOnly = (cmd: "bold" | "italic" | "underline") => {
        focusEditor();
        enableCssMode();
        if (!restoreSelection()) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        document.execCommand(cmd, false);
        // update active states after toggle
        setIsBold(document.queryCommandState("bold"));
        setIsItalic(document.queryCommandState("italic"));
        setIsUnderline(document.queryCommandState("underline"));
    };

    useEffect(() => {
        const load = async () => {
            if (!blogId || !editorRef.current) return;
            try {
                setLoading(true);
                const row = await fetchBlogById(blogId);
                setTitle(row.title);
                // why: set editor content to existing HTML
                editorRef.current.innerHTML = row.content_html || "<p></p>";
                // optional: hydrate UI knobs from meta if present
                if (row.meta?.defaultFontPx) setFontPx(Number(row.meta.defaultFontPx));
                if (row.meta?.fontFamily) setFontFamily(String(row.meta.fontFamily));
                if (row.meta?.color) setForeColor(String(row.meta.color));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blogId]);

    // ------- SUBMIT --------
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const html = editorRef.current?.innerHTML ?? "";
            const meta = { fontFamily, defaultFontPx: fontPx, color: foreColor };

            if (blogId) {
                const updated = await updateBlog(blogId, { title, content_html: html, meta });
                console.log("Updated blog:", updated);
            } else {
                const created = await saveBlog({ title, content_html: html, meta });
                console.log("Created blog:", created);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const beforeControlFocus = () => saveSelection();
    const iconSx = { fontSize: 20 };
    //   const canAlign = true;
    const canUndoRedo = true;

    const activeBg = (active: boolean) => ({
        bgcolor: active ? "cyan" : "transparent",
        "&:hover": { bgcolor: active ? "cyan" : "action.hover" },
    });

    return (
        <DashboardLayout>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
                <Box component="form" onSubmit={onSubmit} sx={{ width: 900, boxShadow: 3, borderRadius: 2, p: 3, bgcolor: "transparent" }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <ArrowBackIos onClick={() => navigate(-1)} sx={{
                            cursor: 'pointer',
                        }} />
                        {blogId ? "Edit Blog" : "Blog Editor"}
                    </Typography>

                    <CustomInput label="Blog Title" value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Enter title" />

                    {/* Editor container */}
                    <Box sx={{ mt: 2, border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden", bgcolor: "transparent" }}>
                        {/* Toolbar */}
                        <Stack direction="row" spacing={1} contentEditable={false}
                            sx={{ p: 1, bgcolor: "transparent", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap", alignItems: "center" }}>
                            <Tooltip title="Undo">
                                <span>
                                    <IconButton disabled={!canUndoRedo} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")}>
                                        <Undo sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Redo">
                                <span>
                                    <IconButton disabled={!canUndoRedo} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")}>
                                        <Redo sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Divider orientation="vertical" flexItem />

                            {/* Bold / Italic / Underline — selection only; active bg cyan */}
                            <Tooltip title="Bold (selection only)">
                                <span>
                                    <IconButton
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => toggleCmdSelectionOnly("bold")}
                                        sx={activeBg(isBold)}
                                    >
                                        <FormatBold sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Italic (selection only)">
                                <span>
                                    <IconButton
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => toggleCmdSelectionOnly("italic")}
                                        sx={activeBg(isItalic)}
                                    >
                                        <FormatItalic sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Underline (selection only)">
                                <span>
                                    <IconButton
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => toggleCmdSelectionOnly("underline")}
                                        sx={activeBg(isUnderline)}
                                    >
                                        <FormatUnderlined sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Divider orientation="vertical" flexItem />

                            {/* Font family (selection only) */}
                            <FormControl size="small" sx={{ minWidth: 60 }}>
                                <InputLabel id="ff">Font</InputLabel>
                                <Select
                                    labelId="ff"
                                    label="Font"
                                    value={fontFamily}
                                    onOpen={beforeControlFocus}
                                    onMouseDownCapture={beforeControlFocus}
                                    onChange={(e: SelectChangeEvent<string>) => applyFontFamily(e.target.value as string)}
                                    renderValue={(v) => <span style={{ fontFamily: `'${v}', sans-serif` }}>{v as string}</span>}
                                    MenuProps={{ MenuListProps: { disableListWrap: true } }}
                                    sx={{ height: 40 }}
                                >
                                    {GOOGLE_FONTS.map((f) => (
                                        <MenuItem key={f} value={f} sx={{ fontFamily: `'${f}', sans-serif` }}>
                                            {f}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Font size with ± (selection only) */}
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFontSize(clamp(fontPx - 1, 8, 120))}>
                                    <TextDecreaseOutlined sx={iconSx} />
                                </IconButton>
                                <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFontSize(clamp(fontPx + 1, 8, 120))}>
                                    <TextIncreaseOutlined sx={iconSx} />
                                </IconButton>
                            </Stack>

                            <Divider orientation="vertical" flexItem />

                            {/* Color (selection only) */}
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <TextField
                                    type="color"
                                    size="small"
                                    value={foreColor}
                                    onMouseDownCapture={beforeControlFocus}
                                    onFocus={beforeControlFocus}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForeColor(v);          // UI only
                                        applyForeColor(v);        // selection only
                                    }}
                                    variant="outlined"
                                    sx={{
                                        minWidth: 45,
                                        "& .MuiOutlinedInput-root": { p: 0, borderRadius: "50%", overflow: "hidden" },
                                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                        "& .MuiInputBase-input": { p: 0, cursor: "pointer", width: 45, height: 45, borderRadius: "50%", border: "none" },
                                    }}
                                />
                            </Stack>

                            <Divider orientation="vertical" flexItem />

                            {/* Alignment — always enabled (acts on current line/selection) */}
                            <Tooltip title="Align left">
                                <span>
                                    <IconButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")}>
                                        <FormatAlignLeft sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Align center">
                                <span>
                                    <IconButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")}>
                                        <FormatAlignCenter sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Align right">
                                <span>
                                    <IconButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")}>
                                        <FormatAlignRight sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Divider orientation="vertical" flexItem />

                            <Tooltip title="Bulleted list">
                                <span>
                                    <IconButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")}>
                                        <FormatListBulleted sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Numbered list">
                                <span>
                                    <IconButton onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")}>
                                        <FormatListNumbered sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Insert link">
                                <span>
                                    <IconButton onMouseDown={(e) => e.preventDefault()} onClick={() => {
                                        focusEditor();
                                        if (!restoreSelection()) return;
                                        const sel = window.getSelection();
                                        if (!sel || sel.isCollapsed) return;
                                        const url = prompt("Enter URL (https://…):");
                                        if (!url) return;
                                        exec("createLink", url);
                                    }}>
                                        <LinkIcon sx={iconSx} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>

                        {/* Editable area with sane defaults */}
                        <Box
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            tabIndex={0}
                            onKeyUp={saveSelection}
                            onMouseUp={saveSelection}
                            onBlur={saveSelection}
                            onFocus={saveSelection}
                            sx={{
                                minHeight: 400,
                                p: 2,
                                outline: "none",
                                bgcolor: "transparent",
                                "&:focus": { boxShadow: "inset 0 0 0 2px rgba(25,118,210,0.25)" },
                                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                                fontSize: 16,
                                color: "#111111",
                                lineHeight: 1.8,
                                "& p": { m: 0, mb: 1.5 },
                                cursor: "text",
                            }}
                        />
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                        <LandingButton
                            title={"Clear Blog"} personal width={"150px"} variant="outlined"
                            onClick={() => { if (editorRef.current) editorRef.current.innerHTML = "<p></p>"; }}
                        />
                        <LandingButton title={"Save Blog"} personal width={"150px"} loading={loading} type="submit" />
                    </Stack>
                </Box>
            </Box>
        </DashboardLayout>
    );
};

export default BlogsEditor;
