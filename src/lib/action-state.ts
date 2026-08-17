export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  accountCreated?: boolean;
};

export const initialActionState: ActionState = {
  status: "idle",
};
