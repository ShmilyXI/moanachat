export function removeChatFromHistory<
  T extends { id: string },
  TPage extends { chats: T[] },
>(histories: TPage[] | undefined, chatId: string): TPage[] | undefined {
  return histories?.map((page) => ({
    ...page,
    chats: page.chats.filter((chat) => chat.id !== chatId),
  }));
}
