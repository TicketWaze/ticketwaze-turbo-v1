"use server";
import { revalidatePath } from "next/cache";
import type {
  EventFormQuestion,
  EventFormQuestionType,
  EventFormResponse,
} from "@ticketwaze/typescript-config";

/**
 * The checkout form an organiser builds for one activity.
 *
 * Every call goes through the API rather than touching anything directly, and
 * every one returns the same `{ error }` | payload union so the page can render
 * the API's own refusal — which matters more than usual here, because most of
 * the refusals are explanations the organiser needs to read: the plan gate, and
 * the freeze on a question people have already answered.
 */

type Failure = { error: string };

function base(organisationId: string, eventId: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}/events/${organisationId}/${eventId}/form-questions`;
}

function headers(accessToken: string, locale: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
}

/**
 * Pulls the message the API actually sent.
 *
 * Validator failures arrive as `errors: [{ message }]` while business refusals
 * arrive as `message`; a page that only reads one of them shows "Something went
 * wrong" for half the reasons a save can fail.
 */
function failureMessage(response: unknown, fallback: string): string {
  const body = response as
    | { message?: string; errors?: Array<{ message?: string }> }
    | null;
  if (body?.message) return body.message;
  const first = body?.errors?.[0]?.message;
  return first ?? fallback;
}

export interface QuestionInput {
  label: string;
  questionType: EventFormQuestionType;
  options?: string[];
  allowOther?: boolean;
  isRequired?: boolean;
}

export async function ListFormQuestions(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
): Promise<
  | { questions: EventFormQuestion[]; canUseForms: boolean; maxQuestions: number }
  | Failure
> {
  try {
    const request = await fetch(base(organisationId, eventId), {
      method: "GET",
      headers: headers(accessToken, locale),
      cache: "no-store",
    });
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not load the questions.") };
    }
    return {
      questions: (response.questions ?? []) as EventFormQuestion[],
      canUseForms: response.canUseForms === true,
      maxQuestions: Number(response.maxQuestions ?? 10),
    };
  } catch {
    return { error: "Could not load the questions." };
  }
}

export async function ListFormResponses(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
): Promise<{ responses: EventFormResponse[] } | Failure> {
  try {
    const request = await fetch(`${base(organisationId, eventId)}/responses`, {
      method: "GET",
      headers: headers(accessToken, locale),
      cache: "no-store",
    });
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not load the answers.") };
    }
    return { responses: (response.responses ?? []) as EventFormResponse[] };
  } catch {
    return { error: "Could not load the answers." };
  }
}

export async function CreateFormQuestion(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
  question: QuestionInput,
  pathname: string,
): Promise<{ status: "success" } | Failure> {
  try {
    const request = await fetch(base(organisationId, eventId), {
      method: "POST",
      headers: headers(accessToken, locale),
      body: JSON.stringify(question),
    });
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not add the question.") };
    }
    revalidatePath(pathname);
    return { status: "success" };
  } catch {
    return { error: "Could not add the question." };
  }
}

export async function UpdateFormQuestion(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
  questionId: string,
  question: QuestionInput,
  pathname: string,
): Promise<{ status: "success" } | Failure> {
  try {
    const request = await fetch(`${base(organisationId, eventId)}/${questionId}`, {
      method: "PUT",
      headers: headers(accessToken, locale),
      body: JSON.stringify(question),
    });
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not save the question.") };
    }
    revalidatePath(pathname);
    return { status: "success" };
  } catch {
    return { error: "Could not save the question." };
  }
}

export async function DeleteFormQuestion(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
  questionId: string,
  pathname: string,
): Promise<{ status: "success" } | Failure> {
  try {
    const request = await fetch(`${base(organisationId, eventId)}/${questionId}`, {
      method: "DELETE",
      headers: headers(accessToken, locale),
    });
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not delete the question.") };
    }
    revalidatePath(pathname);
    return { status: "success" };
  } catch {
    return { error: "Could not delete the question." };
  }
}

/** Retiring a question is the escape hatch the edit freeze leaves open. */
export async function SetFormQuestionActive(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
  questionId: string,
  isActive: boolean,
  pathname: string,
): Promise<{ status: "success" } | Failure> {
  try {
    const request = await fetch(
      `${base(organisationId, eventId)}/${questionId}/active`,
      {
        method: "PATCH",
        headers: headers(accessToken, locale),
        body: JSON.stringify({ isActive }),
      },
    );
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not update the question.") };
    }
    revalidatePath(pathname);
    return { status: "success" };
  } catch {
    return { error: "Could not update the question." };
  }
}

export async function ReorderFormQuestions(
  organisationId: string,
  eventId: string,
  accessToken: string,
  locale: string,
  questionIds: string[],
  pathname: string,
): Promise<{ status: "success" } | Failure> {
  try {
    const request = await fetch(`${base(organisationId, eventId)}/order`, {
      method: "PUT",
      headers: headers(accessToken, locale),
      body: JSON.stringify({ questionIds }),
    });
    const response = await request.json().catch(() => null);
    if (!request.ok || response?.status !== "success") {
      return { error: failureMessage(response, "Could not reorder the questions.") };
    }
    revalidatePath(pathname);
    return { status: "success" };
  } catch {
    return { error: "Could not reorder the questions." };
  }
}
