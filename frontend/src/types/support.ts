export type SenderType='PLAYER'|'AI'|'ADMIN'|'SYSTEM'; export type ConversationStatus='AI'|'HUMAN'|'CLOSED';
export interface SupportMessage{id:number;conversationId:number;senderType:SenderType;senderId:number|null;message:string;intent:string|null;confidence:string|number|null;createdAt:string}
export interface SupportConversation{id:number;userId:number;status:ConversationStatus;language:string;lastMessageAt:string;createdAt:string;updatedAt:string}
