"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/basics";
import { Result } from "@/components/booking/Confirm";
import { copy } from "@/lib/copy";
import { sendContact } from "@/lib/data/messages";

type Field = "name" | "email" | "message";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    message: false,
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const errors: Record<Field, string | null> = {
    name: values.name.trim() ? null : copy.contact.required,
    email: !values.email.trim()
      ? copy.contact.required
      : EMAIL.test(values.email)
        ? null
        : copy.contact.emailInvalid,
    message: values.message.trim() ? null : copy.contact.required,
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (Object.values(errors).some(Boolean)) return;
    setState("sending");
    const result = await sendContact(values);
    setState(result.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <Result
        icon={<CircleCheck size={26} />}
        tone="good"
        title={copy.contact.sentTitle}
        body={copy.contact.sentBody}
      >
        <button
          type="button"
          onClick={() => {
            setValues({ name: "", email: "", message: "" });
            setTouched({ name: false, email: false, message: false });
            setState("idle");
          }}
          className={`${buttonStyles.secondary} justify-self-center`}
        >
          {copy.contact.another}
        </button>
      </Result>
    );
  }

  const field = (
    name: Field,
    label: string,
    input: "input" | "textarea",
    type = "text",
  ) => {
    const error = touched[name] ? errors[name] : null;
    const shared = {
      id: `contact-${name}`,
      name,
      value: values[name],
      onChange: (event: { target: { value: string } }) =>
        setValues((v) => ({ ...v, [name]: event.target.value })),
      onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
      "aria-invalid": !!error,
      "aria-describedby": error ? `contact-${name}-error` : undefined,
      className: `w-full rounded-xl border px-4 text-[15px] focus:ring-2 focus:outline-none ${
        error
          ? "border-full focus:ring-full/30"
          : "border-line focus:border-brand focus:ring-brand/30"
      }`,
    };
    return (
      <div className="grid gap-1.5">
        <label htmlFor={`contact-${name}`} className="text-[14px] font-medium">
          {label}
        </label>
        {input === "input" ? (
          <input
            {...shared}
            type={type}
            autoComplete={name === "message" ? undefined : name}
            className={`${shared.className} h-12`}
          />
        ) : (
          <textarea
            {...shared}
            rows={5}
            className={`${shared.className} py-3`}
          />
        )}
        {error ? (
          <span id={`contact-${name}-error`} className="text-[13px] text-full">
            {error}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="grid gap-4"
    >
      {field("name", copy.contact.name, "input")}
      {field("email", copy.contact.email, "input", "email")}
      {field("message", copy.contact.message, "textarea")}
      {state === "error" ? (
        <p
          role="alert"
          className="rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning-ink"
        >
          {copy.common.errorBody}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state === "sending"}
        className={buttonStyles.primary}
      >
        {state === "sending" ? (
          <>
            <LoaderCircle aria-hidden size={18} className="animate-spin" />
            {copy.contact.sending}
          </>
        ) : (
          copy.contact.send
        )}
      </button>
    </form>
  );
}
