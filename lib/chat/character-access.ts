export function canUseCharacter(
  character: { userId: string; visibility: "private" | "public" },
  userId: string
): boolean {
  return character.visibility === "public" || character.userId === userId;
}
