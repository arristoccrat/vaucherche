export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const NOT_SIGNED_IN: ActionResult<never> = {
  ok: false,
  error: "Сесията е изтекла. Влезте отново — промяната не е записана.",
};
