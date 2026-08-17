import { z } from "zod";

export const USERNAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

const usernameSchema = z
  .string()
  .transform((value) => value.trim().normalize("NFKC"))
  .refine((value) => [...value].length >= 2, {
    message: "用户名至少需要 2 个字符",
  })
  .refine((value) => [...value].length <= 20, {
    message: "用户名最多允许 20 个字符",
  })
  .refine((value) => USERNAME_PATTERN.test(value), {
    message: "用户名仅支持中文、英文、数字、下划线和连字符",
  });

export type ParsedUsername = {
  display: string;
  normalized: string;
};

export function normalizeUsername(username: string): string {
  return username.trim().normalize("NFKC").toLocaleLowerCase("und");
}

export function parseUsername(username: string): ParsedUsername {
  const display = usernameSchema.parse(username);

  return {
    display,
    normalized: normalizeUsername(display),
  };
}
