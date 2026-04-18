"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Award, Upload, Download, X, RefreshCw, Mail, Users, Calendar } from "lucide-react";
import { EventSummary } from "@/lib/types";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificateLayout";

interface CertificateTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  nameX: number;
  nameY: number;
  fontSize: number;
  fontColor: string;
  createdAt: Date;
}

interface CertificateRecipient {
  registrationId: number | null;
  name: string;
  email: string;
}

interface CertificatesClientProps {
  event: EventSummary;
}

export default function CertificatesClient({ event }: CertificatesClientProps) {
  const [certificates, setCertificates] = useState<CertificateTemplate[]>([]);
  const [recipients, setRecipients] = useState<CertificateRecipient[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [nameX, setNameX] = useState(400);
  const [nameY, setNameY] = useState(300);
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState("#000000");
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(0);
  const [selectedCert, setSelectedCert] = useState<CertificateTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!event.id.startsWith("evt-"));
  const [toast, setToast] = useState<string>("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  };

  const resizePreview = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    setPreviewW(el.getBoundingClientRect().width);
  }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    resizePreview();
    const ro = new ResizeObserver(() => resizePreview());
    ro.observe(el);
    return () => ro.disconnect();
  }, [backgroundImage, resizePreview]);

  const displayNameFontPx =
    previewW > 0
      ? Math.max(8, fontSize * (previewW / CERTIFICATE_CANVAS_WIDTH))
      : fontSize;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setBackgroundImage(result);
      showToast("Image uploaded — drag the name label to position (PDF coordinates).");
    };
    reader.readAsDataURL(file);
  };

  const handleNamePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    e.preventDefault();
    const rect = previewRef.current.getBoundingClientRect();
    const scaleX = CERTIFICATE_CANVAS_WIDTH / rect.width;
    const scaleY = CERTIFICATE_CANVAS_HEIGHT / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    dragOffsetRef.current = { x: px - nameX, y: py - nameY };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const el = previewRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scaleX = CERTIFICATE_CANVAS_WIDTH / rect.width;
      const scaleY = CERTIFICATE_CANVAS_HEIGHT / rect.height;
      let nx = (e.clientX - rect.left) * scaleX - dragOffsetRef.current.x;
      let ny = (e.clientY - rect.top) * scaleY - dragOffsetRef.current.y;
      nx = Math.max(0, Math.min(nx, CERTIFICATE_CANVAS_WIDTH - 4));
      ny = Math.max(0, Math.min(ny, CERTIFICATE_CANVAS_HEIGHT - 4));
      setNameX(Math.round(nx));
      setNameY(Math.round(ny));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging]);

  const loadData = async () => {
    if (event.id.startsWith("evt-")) {
      setIsInitialLoading(false);
      return;
    }
    try {
      setIsInitialLoading(true);
      const [templatesRes, recipientsRes] = await Promise.all([
        fetch(`/api/events/${event.id}/certificates/templates`),
        fetch(`/api/events/${event.id}/certificates/recipients`),
      ]);

      const templatesJson = await templatesRes.json().catch(() => ({}));
      const recipientsJson = await recipientsRes.json().catch(() => ({}));

      if (!templatesRes.ok || !templatesJson?.success) {
        throw new Error(templatesJson?.error || `Failed loading templates (${templatesRes.status})`);
      }
      if (!recipientsRes.ok || !recipientsJson?.success) {
        throw new Error(recipientsJson?.error || `Failed loading recipients (${recipientsRes.status})`);
      }

      const mappedTemplates: CertificateTemplate[] = (templatesJson.data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        backgroundImage: row.background_image,
        nameX: row.name_x,
        nameY: row.name_y,
        fontSize: row.font_size,
        fontColor: row.font_color,
        createdAt: new Date(row.created_at),
      }));

      setCertificates(mappedTemplates);
      setRecipients(recipientsJson.data || []);
    } catch (err) {
      console.error("Failed loading certificate data:", err);
      showToast(err instanceof Error ? err.message : "Failed loading certificate data");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const createCertificate = async () => {
    if (!templateName.trim()) {
      showToast("Enter a template name");
      return;
    }
    if (!backgroundImage) {
      showToast("Upload a background image");
      return;
    }

    if (event.id.startsWith("evt-")) {
      setCertificates([
        ...certificates,
        {
          id: `cert-${Date.now()}`,
          name: templateName,
          backgroundImage,
          nameX,
          nameY,
          fontSize,
          fontColor,
          createdAt: new Date(),
        },
      ]);
      setTemplateName("");
      setBackgroundImage("");
      setNameX(400);
      setNameY(300);
      showToast("Template created (local draft event).");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/events/${event.id}/certificates/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          backgroundImage,
          nameX,
          nameY,
          fontSize,
          fontColor,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed creating template (${res.status})`);
      }
      setTemplateName("");
      setBackgroundImage("");
      setNameX(400);
      setNameY(300);
      showToast("Template created");
      await loadData();
    } catch (err) {
      console.error("Create template error:", err);
      showToast(err instanceof Error ? err.message : "Error creating template");
    } finally {
      setIsLoading(false);
    }
  };

  const issueCertificates = async (queueEmail: boolean) => {
    if (!selectedCert) {
      showToast("Select a template");
      return;
    }
    if (recipients.length === 0 && !event.id.startsWith("evt-")) {
      showToast("No eligible recipients for certificates");
      return;
    }

    setIsLoading(true);
    try {
      if (event.id.startsWith("evt-")) {
        showToast(queueEmail ? "Queued certificate emails (simulated)." : "Certificates issued (simulated).");
        return;
      }

      const recipientIds = recipients
        .map((r) => r.registrationId)
        .filter((id): id is number => typeof id === "number");

      const res = await fetch(`/api/events/${event.id}/certificates/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: Number(selectedCert.id),
          recipientIds,
          queueEmail,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed issuing certificates (${res.status})`);
      }

      if (queueEmail) {
        const sent = json?.emailProcessing?.sent ?? 0;
        const failed = json?.emailProcessing?.failed ?? 0;
        showToast(`Issued ${json?.issuedCount ?? 0}. Email sent: ${sent}, failed: ${failed}.`);
      } else {
        showToast(`Issued ${json?.issuedCount ?? 0} certificates.`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error issuing certificates");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCertificate = async (id: string) => {
    if (event.id.startsWith("evt-")) {
      setCertificates(certificates.filter((c) => c.id !== id));
      if (selectedCert?.id === id) setSelectedCert(null);
      showToast("Deleted");
      return;
    }

    try {
      const res = await fetch(`/api/events/${event.id}/certificates/templates/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed deleting template (${res.status})`);
      }
      if (selectedCert?.id === id) setSelectedCert(null);
      showToast("Template deleted");
      await loadData();
    } catch (err) {
      console.error("Delete template error:", err);
      showToast(err instanceof Error ? err.message : "Failed deleting template");
    }
  };

  const eventDateLabel = event.date
    ? (() => {
        try {
          return new Date(event.date).toLocaleDateString(undefined, { dateStyle: "medium" });
        } catch {
          return event.date;
        }
      })()
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7FC] to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 max-w-[min(100vw-2rem,28rem)] -translate-x-1/2 rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white shadow-xl dark:bg-white dark:text-gray-900 sm:bottom-auto sm:left-auto sm:right-6 sm:top-6 sm:translate-x-0"
        >
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 border-b border-gray-200/80 pb-6 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] shadow-lg shadow-blue-500/10">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-pretty text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                E-Certificates
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                {eventDateLabel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {eventDateLabel}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {recipients.length} eligible recipient{recipients.length === 1 ? "" : "s"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    event.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Build a template, position the attendee name on the preview, then issue PDFs or email links. Recipients
                are confirmed or checked-in attendees (not waitlisted).
              </p>
            </div>
          </div>
          {!event.id.startsWith("evt-") ? (
            <button
              type="button"
              onClick={() => loadData()}
              disabled={isInitialLoading}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#3D518C]/40 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw size={16} className={isInitialLoading ? "animate-spin" : ""} />
              Refresh data
            </button>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3D518C] text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Background</h2>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
              <label
                htmlFor="image-upload"
                className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 transition hover:border-[#3D518C] hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {backgroundImage ? "Image ready — tap to replace" : "Upload certificate background"}
                </span>
              </label>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3D518C] text-xs font-bold text-white">
                  2
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Template & typography</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Template name (e.g. Participation 2026)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#3D518C] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <div className="space-y-6">
                  {/* Font Size with Presets */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Name font size: <span className="text-[#3D518C] dark:text-blue-400">{fontSize}px</span>
                      </label>
                      <div className="flex gap-1.5">
                        {[20, 28, 36, 48, 64].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFontSize(sz)}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                              fontSize === sz
                                ? "bg-[#3D518C] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={96}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="h-2 w-full touch-manipulation appearance-none rounded-lg bg-gray-200 accent-[#3D518C] dark:bg-gray-700 dark:accent-blue-500"
                    />
                  </div>

                  {/* Color Picker with Swatches */}
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-700 dark:text-gray-300">Name color</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        "#000000", // Black
                        "#FFFFFF", // White
                        "#3D518C", // Indigo
                        "#4B5563", // Gray 600
                        "#EF4444", // Red 500
                        "#10B981", // Emerald 500
                        "#F59E0B", // Amber 500
                        "#6366F1", // Indigo 500
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFontColor(color)}
                          className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                            fontColor.toUpperCase() === color.toUpperCase()
                              ? "scale-110 border-[#3D518C] shadow-lg dark:border-white"
                              : "border-transparent shadow-sm"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}

                      {/* Custom Color Picker Button */}
                      <div className="relative h-8 w-8 group">
                        <input
                          type="color"
                          id="custom-color-picker"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <label
                          htmlFor="custom-color-picker"
                          className={`flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-[#3D518C] dark:border-gray-700 dark:bg-gray-800 ${
                            ![
                              "#000000",
                              "#FFFFFF",
                              "#3D518C",
                              "#4B5563",
                              "#EF4444",
                              "#10B981",
                              "#F59E0B",
                              "#6366F1",
                            ].includes(fontColor.toUpperCase())
                              ? "scale-110 border-[#3D518C] shadow-lg dark:border-white"
                              : ""
                          }`}
                        >
                          <div className="h-full w-full" style={{ backgroundColor: fontColor }} />
                        </label>
                      </div>
                      <span className="font-mono text-xs font-semibold uppercase text-gray-500">{fontColor}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Name position uses a{" "}
                  <strong className="font-semibold text-gray-700 dark:text-gray-300">
                    {CERTIFICATE_CANVAS_WIDTH}×{CERTIFICATE_CANVAS_HEIGHT}
                  </strong>{" "}
                  canvas — the same space as the generated PDF. Drag the label in the preview to place the attendee
                  name.
                </p>
                <button
                  type="button"
                  onClick={createCertificate}
                  disabled={!templateName.trim() || !backgroundImage || isLoading}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] px-4 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
                >
                  <Award size={18} />
                  Save template
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <section className="sticky top-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3D518C] text-xs font-bold text-white">
                  3
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live preview</h2>
              </div>
              <div
                ref={previewRef}
                className="relative w-full overflow-hidden rounded-xl border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
                style={{
                  aspectRatio: `${CERTIFICATE_CANVAS_WIDTH} / ${CERTIFICATE_CANVAS_HEIGHT}`,
                  touchAction: isDragging ? "none" : undefined,
                }}
              >
                {backgroundImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={backgroundImage} alt="" className="h-full w-full object-cover" />
                    <div
                      role="button"
                      tabIndex={0}
                      onPointerDown={handleNamePointerDown}
                      className={`absolute max-w-[92%] cursor-grab select-none break-words rounded-lg border-2 border-dashed border-[#3D518C] bg-white/90 px-2 py-1 font-bold active:cursor-grabbing ${
                        isDragging ? "ring-2 ring-[#3D518C]" : "hover:ring-2 hover:ring-[#3D518C]/40"
                      }`}
                      style={{
                        left: `${(nameX / CERTIFICATE_CANVAS_WIDTH) * 100}%`,
                        top: `${(nameY / CERTIFICATE_CANVAS_HEIGHT) * 100}%`,
                        fontSize: `${displayNameFontPx}px`,
                        color: fontColor,
                        transform: "translateY(-50%)",
                      }}
                    >
                      Attendee Name
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-gray-400">
                    Upload a background to position the name
                  </div>
                )}
              </div>
              <p className="mt-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                PDF coords: x {nameX}, y {nameY} / {CERTIFICATE_CANVAS_WIDTH}×{CERTIFICATE_CANVAS_HEIGHT}
              </p>
            </section>
          </div>
        </div>

        {recipients.length > 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Users className="h-5 w-5 text-[#3D518C]" />
              Eligible recipients
            </h2>
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recipients.map((r, i) => (
                      <tr key={`${r.email}-${i}`} className="text-gray-800 dark:text-gray-200">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <ul className="space-y-3 md:hidden">
              {recipients.map((r, i) => (
                <li
                  key={`${r.email}-${i}`}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{r.name}</p>
                  <p className="mt-0.5 break-all text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : !isInitialLoading ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center dark:border-gray-600 dark:bg-gray-900/40">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No eligible recipients yet. Attendees must be confirmed or checked in (and not waitlisted).
            </p>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Saved templates ({certificates.length})
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => issueCertificates(false)}
                disabled={!selectedCert || isLoading || certificates.length === 0 || isInitialLoading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                Issue ({recipients.length})
              </button>
              <button
                type="button"
                onClick={() => issueCertificates(true)}
                disabled={!selectedCert || isLoading || certificates.length === 0 || isInitialLoading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#3D518C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#324373] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
              >
                <Mail size={16} />
                Issue + email
              </button>
            </div>
          </div>

          {isInitialLoading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading certificate data…</div>
          ) : certificates.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <Award className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Create a template using the steps above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCert(cert)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCert(cert);
                    }
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    selectedCert?.id === cert.id
                      ? "border-[#3D518C] bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-gray-200 hover:border-[#3D518C]/40 dark:border-gray-600"
                  }`}
                >
                  <div className="mb-3 flex gap-3">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cert.backgroundImage} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">{cert.name}</h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCertificate(cert.id);
                          }}
                          className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                          aria-label="Delete template"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {cert.fontSize}px • {cert.fontColor}
                      </p>
                    </div>
                  </div>
                  {selectedCert?.id === cert.id ? (
                    <div className="border-t border-gray-200 pt-3 dark:border-gray-600">
                      <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                        Selected — PDF name position: ({cert.nameX}, {cert.nameY})
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          issueCertificates(false);
                        }}
                        className="w-full rounded-lg bg-[#3D518C] py-2.5 text-xs font-semibold text-white hover:bg-[#324373] touch-manipulation"
                      >
                        Issue with this template
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
